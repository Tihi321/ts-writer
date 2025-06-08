import { bookManagerService } from "./bookManager";
import { indexedDBService, BookConfig, Chapter, Idea, BookEntry } from "./indexedDB";
import { googleDriveService } from "./googleDrive";
import { googleAuth } from "./googleAuth";
import { settingsStore } from "../stores/settingsStore";

export type SyncStatus = "synced" | "pending" | "manual" | "offline" | "error";

class DataService {
  private isInitialized = false;
  private syncInProgress = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Always initialize IndexedDB and BookManager first (works offline)
    await bookManagerService.initialize();

    // Try to initialize Google Auth if sync is enabled or auto sign-in is enabled
    if (settingsStore.settings.googleSyncEnabled || settingsStore.settings.autoSignIn) {
      try {
        await googleAuth.initialize();

        // If auto sign-in is enabled and user is not signed in, try to sign in
        if (settingsStore.settings.autoSignIn && !googleAuth.signedIn) {
          try {
            await googleAuth.signIn();
          } catch (error) {
            // Auto sign-in failed silently
          }
        }

        // If user is signed in after initialization, set up Google Drive
        if (googleAuth.signedIn) {
          await googleDriveService.initialize();
          // Perform initial sync if auto-sync is enabled
          if (settingsStore.settings.autoSyncEnabled) {
            await this.syncFromCloud();
          }
        }
      } catch (error) {
        // Failed to initialize Google services, working offline
      }
    }

    this.isInitialized = true;
  }

  // Enhanced book operations using book manager
  async listBooks(): Promise<string[]> {
    await this.initialize();
    const books = await bookManagerService.listBooks();
    return books.map((book) => book.name);
  }

  async listBooksWithInfo() {
    await this.initialize();
    return await bookManagerService.listBooks();
  }

  async createBook(bookName: string): Promise<void> {
    await this.initialize();
    await bookManagerService.createLocalBook(bookName);

    // Manual sync only - no automatic syncing
  }

  async createBookWithId(bookName: string): Promise<string> {
    await this.initialize();
    const bookId = await bookManagerService.createLocalBook(bookName);

    // Manual sync only - no automatic syncing

    return bookId;
  }

  async getBookConfig(bookId: string): Promise<BookConfig | null> {
    await this.initialize();
    const book = await bookManagerService.getBook(bookId);
    return book?.config || null;
  }

  async getBookById(bookId: string): Promise<BookEntry | null> {
    await this.initialize();
    return await bookManagerService.getBook(bookId);
  }

  async saveBookConfig(bookId: string, config: BookConfig): Promise<void> {
    await this.initialize();
    const book = await bookManagerService.getBook(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }
    await bookManagerService.updateBookConfig(book.id, config);
  }

  async deleteBook(bookId: string): Promise<void> {
    await this.initialize();
    const book = await bookManagerService.getBook(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }
    await bookManagerService.deleteBook(book.id, "local");
  }

  // Chapter operations
  async getChapterContent(bookId: string, fileName: string): Promise<string | null> {
    await this.initialize();
    const book = await bookManagerService.getBook(bookId);
    if (!book) return null;
    return await bookManagerService.getChapterContent(book.id, fileName);
  }

  async saveChapterContent(bookId: string, fileName: string, content: string): Promise<void> {
    await this.initialize();
    const book = await bookManagerService.getBook(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }
    await bookManagerService.saveChapterContent(book.id, fileName, content);
  }

  async deleteChapterContent(bookId: string, fileName: string): Promise<void> {
    await this.initialize();
    const book = await bookManagerService.getBook(bookId);
    if (!book) return;
    await bookManagerService.deleteChapterContent(book.id, fileName);
  }

  async listChapterFiles(bookId: string): Promise<string[]> {
    await this.initialize();
    const book = await bookManagerService.getBook(bookId);
    if (!book) return [];
    return await bookManagerService.listChapterFiles(book.id);
  }

  // Enhanced sync operations
  async syncToCloud(): Promise<void> {
    if (!settingsStore.settings.googleSyncEnabled || !googleAuth.signedIn || this.syncInProgress)
      return;

    // Set a timeout to prevent sync from getting stuck
    const timeoutId = setTimeout(() => {
      this.syncInProgress = false;
    }, 30000); // 30 second timeout

    try {
      this.syncInProgress = true;

      // Get all out-of-sync books and sync them
      const outOfSyncBooks = await bookManagerService.listOutOfSyncBooks();

      for (const book of outOfSyncBooks) {
        try {
          if (book.source === "local") {
            // Export local books to cloud
            await bookManagerService.exportBookToCloud(book.id);
          } else {
            // Push changes for cloud/imported books
            await bookManagerService.syncBookWithCloud(book.id, "push");
          }
        } catch (error) {
          console.error(`Failed to sync book ${book.name}:`, error);
          // Continue with other books
        }
      }
    } catch (error) {
      console.error("Failed to sync to cloud:", error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
      this.syncInProgress = false;
    }
  }

  async syncFromCloud(): Promise<void> {
    if (!settingsStore.settings.googleSyncEnabled || !googleAuth.signedIn || this.syncInProgress)
      return;

    try {
      this.syncInProgress = true;

      // Get available cloud books
      const availableCloudBooks = await bookManagerService.getAvailableCloudBooks();

      // Import new books that aren't locally available
      for (const cloudBook of availableCloudBooks) {
        if (cloudBook.available) {
          try {
            await bookManagerService.importCloudBook(cloudBook.id);
          } catch (error) {
            console.error(`Failed to import cloud book ${cloudBook.name}:`, error);
          }
        }
      }

      // Sync existing cloud/imported books
      const cloudBooks = await bookManagerService.listCloudBooks();
      for (const book of cloudBooks) {
        if (book.syncStatus === "out_of_sync") {
          try {
            // For now, cloud wins in conflicts (can be enhanced later)
            await bookManagerService.syncBookWithCloud(book.id, "pull");
          } catch (error) {
            console.error(`Failed to sync book ${book.name} from cloud:`, error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to sync from cloud:", error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Enhanced sync status and operations
  async getSyncStatus(): Promise<SyncStatus> {
    if (!settingsStore.settings.googleSyncEnabled) {
      return "manual";
    }

    if (!googleAuth.signedIn) {
      return "offline";
    }

    if (this.syncInProgress) {
      return "pending";
    }

    try {
      const canConnect = await bookManagerService.checkCloudConnection();
      if (!canConnect) {
        return "error";
      }

      const outOfSyncBooks = await bookManagerService.listOutOfSyncBooks();
      return outOfSyncBooks.length > 0 ? "pending" : "synced";
    } catch (error) {
      return "error";
    }
  }

  resetSyncState(): void {
    this.syncInProgress = false;
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  // Note: Auth state changes can be monitored through googleAuth.signedIn reactive signal

  // New enhanced methods
  async getBookStats() {
    await this.initialize();
    return await bookManagerService.getBookStats();
  }

  async syncAllOutOfSyncBooks() {
    await this.initialize();
    return await bookManagerService.syncAllOutOfSyncBooks();
  }

  async exportBookToCloud(bookId: string) {
    await this.initialize();
    return await bookManagerService.exportBookToCloud(bookId);
  }

  async importCloudBook(cloudBookId: string) {
    await this.initialize();
    return await bookManagerService.importCloudBook(cloudBookId);
  }

  async getAvailableCloudBooks() {
    await this.initialize();
    return await bookManagerService.getAvailableCloudBooks();
  }
}

// Create singleton instance
export const dataService = new DataService();

// Re-export types for convenience
export type { BookConfig, Chapter, Idea };
