import { indexedDBService, BookConfig, Chapter, Idea } from "./indexedDB";
import { googleDriveService } from "./googleDrive";
import { googleAuth } from "./googleAuth";
import { settingsStore } from "../stores/settingsStore";

export type SyncStatus = "synced" | "pending" | "manual" | "offline" | "error";

class DataService {
  private isInitialized = false;
  private syncInProgress = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Always initialize IndexedDB first (works offline)
    await indexedDBService.initialize();

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

  // Book operations
  async listBooks(): Promise<string[]> {
    await this.initialize();
    return await indexedDBService.listBooks();
  }

  async createBook(bookName: string): Promise<void> {
    await this.initialize();
    await indexedDBService.createBook(bookName);

    // Sync to cloud if sync is enabled and online
    if (settingsStore.settings.googleSyncEnabled && googleAuth.signedIn) {
      this.syncToCloud().catch(console.error);
    }
  }

  async getBookConfig(bookName: string): Promise<BookConfig | null> {
    await this.initialize();
    return await indexedDBService.getBookConfig(bookName);
  }

  async saveBookConfig(bookName: string, config: BookConfig): Promise<void> {
    await this.initialize();
    await indexedDBService.saveBookConfig(bookName, config);

    // Sync to cloud if sync is enabled, auto-sync is enabled, and online
    if (
      settingsStore.settings.googleSyncEnabled &&
      settingsStore.settings.autoSyncEnabled &&
      googleAuth.signedIn
    ) {
      this.syncToCloud().catch(console.error);
    }
  }

  async deleteBook(bookName: string): Promise<void> {
    await this.initialize();
    await indexedDBService.deleteBook(bookName);

    // Sync to cloud if sync is enabled and online
    if (settingsStore.settings.googleSyncEnabled && googleAuth.signedIn) {
      this.syncToCloud().catch(console.error);
    }
  }

  // Chapter operations
  async getChapterContent(bookName: string, fileName: string): Promise<string | null> {
    await this.initialize();
    return await indexedDBService.getChapterContent(bookName, fileName);
  }

  async saveChapterContent(bookName: string, fileName: string, content: string): Promise<void> {
    await this.initialize();
    await indexedDBService.saveChapterContent(bookName, fileName, content);

    // Sync to cloud if sync is enabled, auto-sync is enabled, and online
    if (
      settingsStore.settings.googleSyncEnabled &&
      settingsStore.settings.autoSyncEnabled &&
      googleAuth.signedIn
    ) {
      this.syncToCloud().catch(console.error);
    }
  }

  async deleteChapterContent(bookName: string, fileName: string): Promise<void> {
    await this.initialize();
    await indexedDBService.deleteChapterContent(bookName, fileName);

    // Sync to cloud if sync is enabled and online
    if (settingsStore.settings.googleSyncEnabled && googleAuth.signedIn) {
      this.syncToCloud().catch(console.error);
    }
  }

  async listChapterFiles(bookName: string): Promise<string[]> {
    await this.initialize();
    return await indexedDBService.listChapterFiles(bookName);
  }

  // Sync operations
  async syncToCloud(): Promise<void> {
    if (!settingsStore.settings.googleSyncEnabled || !googleAuth.signedIn || this.syncInProgress)
      return;

    // Set a timeout to prevent sync from getting stuck
    const timeoutId = setTimeout(() => {
      this.syncInProgress = false;
    }, 30000); // 30 second timeout

    try {
      this.syncInProgress = true;

      const pendingChanges = await indexedDBService.getPendingChanges();

      // Sync pending books
      for (const bookName of pendingChanges.books) {
        const config = await indexedDBService.getBookConfig(bookName);
        if (config) {
          await googleDriveService.saveBookConfig(bookName, config);
          await indexedDBService.markAsSynced("book", bookName);
        }
      }

      // Sync pending chapters
      for (const { bookName, fileName } of pendingChanges.chapters) {
        const content = await indexedDBService.getChapterContent(bookName, fileName);
        if (content !== null) {
          await googleDriveService.saveChapterContent(bookName, fileName, content);
          await indexedDBService.markAsSynced("chapter", `${bookName}:${fileName}`);
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

      // Get books from Google Drive
      const cloudBooks = await googleDriveService.listBooks();

      for (const bookName of cloudBooks) {
        // Sync book config
        const cloudConfig = await googleDriveService.getBookConfig(bookName);
        if (cloudConfig) {
          const localConfig = await indexedDBService.getBookConfig(bookName);

          // Simple conflict resolution: cloud wins for now
          // TODO: Implement proper conflict resolution
          if (!localConfig || JSON.stringify(localConfig) !== JSON.stringify(cloudConfig)) {
            await indexedDBService.saveBookConfig(bookName, cloudConfig);
            await indexedDBService.markAsSynced("book", bookName);
          }
        }

        // Sync chapter files
        const cloudChapterFiles = await googleDriveService.listChapterFiles(bookName);

        for (const fileName of cloudChapterFiles) {
          const cloudContent = await googleDriveService.getChapterContent(bookName, fileName);
          if (cloudContent !== null) {
            const localContent = await indexedDBService.getChapterContent(bookName, fileName);

            // Simple conflict resolution: cloud wins for now
            if (localContent !== cloudContent) {
              await indexedDBService.saveChapterContent(bookName, fileName, cloudContent);
              await indexedDBService.markAsSynced("chapter", `${bookName}:${fileName}`);
            }
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

  async getSyncStatus(): Promise<SyncStatus> {
    if (!settingsStore.settings.googleSyncEnabled || !googleAuth.signedIn) return "offline";
    if (this.syncInProgress) return "pending";

    try {
      const pendingChanges = await indexedDBService.getPendingChanges();
      const hasPendingChanges =
        pendingChanges.books.length > 0 || pendingChanges.chapters.length > 0;

      // If there are pending changes but auto-sync is disabled, show as manual
      // to indicate that manual sync is needed
      if (hasPendingChanges && !settingsStore.settings.autoSyncEnabled) {
        return "manual";
      }

      return hasPendingChanges ? "pending" : "synced";
    } catch (error) {
      console.error("Error getting sync status:", error);
      return "error";
    }
  }

  async forceSyncFromCloud(): Promise<void> {
    await this.syncFromCloud();
  }

  async forceSyncToCloud(): Promise<void> {
    await this.syncToCloud();
  }

  // Reset sync state in case it gets stuck
  resetSyncState(): void {
    this.syncInProgress = false;
  }

  // Check if sync is currently in progress
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  // Event handling for real-time sync (replaces WebSocket)
  onAuthStateChange(callback: (signedIn: boolean) => void): void {
    // This would be implemented with a proper event system
    // For now, components can check googleAuth.signedIn reactively
  }
}

// Create singleton instance
export const dataService = new DataService();

// Re-export types for convenience
export type { BookConfig, Chapter, Idea };
