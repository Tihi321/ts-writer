import { indexedDBService, BookEntry, BookConfig, CloudBooksIndex, BookInfo } from "./indexedDB";
import { googleDriveService } from "./googleDrive";
import { googleAuth } from "./googleAuth";

export type BookSource = "local" | "cloud" | "imported";
export type SyncStatus = "in_sync" | "out_of_sync" | "local_only" | "cloud_only";

export interface BookSummary {
  id: string;
  name: string;
  source: BookSource;
  syncStatus: SyncStatus;
  localLastModified: number;
  cloudLastModified?: number;
  version: string;
}

export interface CloudBookInfo {
  id: string;
  name: string;
  folderPath: string;
  lastModified: number;
  version: string;
  available: boolean; // whether it's available for import
}

class BookManagerService {
  async initialize(): Promise<void> {
    await indexedDBService.initialize();
  }

  // Local book operations
  async createLocalBook(name: string): Promise<string> {
    // Check if book with same name already exists
    const existingBooks = await this.listBooks();
    const nameExists = existingBooks.some((book) => book.name === name);

    if (nameExists) {
      throw new Error(`A book with the name "${name}" already exists`);
    }

    return await indexedDBService.createLocalBook(name);
  }

  async getBook(bookId: string): Promise<BookEntry | null> {
    const result = await indexedDBService.getBook(bookId);
    return result;
  }

  async updateBookConfig(bookId: string, config: BookConfig): Promise<void> {
    await indexedDBService.updateBookConfig(bookId, config);
  }

  async deleteBook(
    bookId: string,
    deleteFrom: "local" | "cloud" | "both" = "local"
  ): Promise<void> {
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    if (deleteFrom === "local" || deleteFrom === "both") {
      await indexedDBService.deleteBook(bookId);
    }

    if (deleteFrom === "cloud" || deleteFrom === "both") {
      if (googleAuth.signedIn) {
        try {
          await googleDriveService.deleteBookFromCloud(bookId);
        } catch (error) {
          console.error(`Failed to delete book ${bookId} from cloud:`, error);
          throw new Error("Failed to delete book from cloud");
        }
      } else {
        throw new Error("Must be signed in to delete from cloud");
      }
    }
  }

  // Book listing and filtering
  async listBooks(): Promise<BookSummary[]> {
    const books = await indexedDBService.listBooks();
    return books.map((book) => ({
      id: book.id,
      name: book.name,
      source: book.source,
      syncStatus: book.syncStatus,
      localLastModified: book.localLastModified,
      cloudLastModified: book.cloudLastModified,
      version: book.version,
    }));
  }

  async listLocalBooks(): Promise<BookSummary[]> {
    const books = await this.listBooks();
    return books.filter((book) => book.source === "local");
  }

  async listCloudBooks(): Promise<BookSummary[]> {
    const books = await this.listBooks();
    return books.filter((book) => book.source === "cloud" || book.source === "imported");
  }

  async listOutOfSyncBooks(): Promise<BookSummary[]> {
    const books = await this.listBooks();
    return books.filter((book) => book.syncStatus === "out_of_sync");
  }

  // Sync status management
  async updateSyncStatus(
    bookId: string,
    status: SyncStatus,
    cloudLastModified?: number
  ): Promise<void> {
    await indexedDBService.updateBookSyncStatus(bookId, status, cloudLastModified);
  }

  async markAsInSync(bookId: string, cloudLastModified: number): Promise<void> {
    await this.updateSyncStatus(bookId, "in_sync", cloudLastModified);
  }

  async markAsOutOfSync(bookId: string): Promise<void> {
    await this.updateSyncStatus(bookId, "out_of_sync");
  }

  // Cloud operations (now implemented)
  async getAvailableCloudBooks(): Promise<CloudBookInfo[]> {
    if (!googleAuth.signedIn) {
      return [];
    }

    try {
      await googleDriveService.initialize();
      const cloudIndex = await googleDriveService.getCloudBooksIndex();

      if (!cloudIndex) {
        return [];
      }

      // Get list of locally imported books to mark availability
      const localBooks = await this.listBooks();
      const localBookIds = new Set(localBooks.map((book) => book.id));

      return Object.entries(cloudIndex.books).map(([bookId, bookData]) => ({
        id: bookId,
        name: bookData.name,
        folderPath: bookData.folderPath,
        lastModified: bookData.lastModified,
        version: bookData.version,
        available: !localBookIds.has(bookId), // Available if not already imported
      }));
    } catch (error) {
      console.error("Failed to get available cloud books:", error);
      return [];
    }
  }

  async importCloudBook(cloudBookId: string): Promise<string> {
    if (!googleAuth.signedIn) {
      throw new Error("Must be signed in to import from cloud");
    }

    try {
      await googleDriveService.initialize();

      // Check if book already exists locally
      const existingBook = await this.getBook(cloudBookId);
      if (existingBook) {
        throw new Error(`Book with ID ${cloudBookId} already exists locally`);
      }

      // Import book data from cloud
      const cloudBookData = await googleDriveService.importBook(cloudBookId);
      if (!cloudBookData) {
        throw new Error(`Book with ID ${cloudBookId} not found in cloud`);
      }

      const { bookInfo, chapters } = cloudBookData;

      // Create local book entry
      const bookEntry: BookEntry = {
        id: cloudBookId,
        name: bookInfo.name,
        source: "imported",
        syncStatus: "in_sync",
        config: bookInfo.config,
        localLastModified: bookInfo.lastModified,
        cloudLastModified: bookInfo.lastModified,
        cloudFolderPath: cloudBookId,
        version: bookInfo.version,
      };

      await indexedDBService.saveBook(bookEntry);

      // Import all chapters
      for (const [fileName, content] of Object.entries(chapters)) {
        await indexedDBService.saveChapterContent(cloudBookId, fileName, content);
      }

      // Mark chapters as synced
      for (const fileName of Object.keys(chapters)) {
        await indexedDBService.markAsSynced("chapter", `${cloudBookId}:${fileName}`);
      }

      return cloudBookId;
    } catch (error) {
      console.error("Failed to import cloud book:", error);
      throw error;
    }
  }

  async exportBookToCloud(bookId: string): Promise<void> {
    if (!googleAuth.signedIn) {
      throw new Error("Must be signed in to export to cloud");
    }

    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    try {
      await googleDriveService.initialize();

      // Prepare book info
      const bookInfo: BookInfo = {
        id: bookId,
        name: book.name,
        version: book.version,
        createdAt: book.localLastModified, // Use local modified as created time
        lastModified: book.localLastModified,
        config: book.config,
      };

      // Get all chapters
      const chapterFiles = await indexedDBService.listChapterFiles(bookId);
      const chapters: { [fileName: string]: string } = {};

      for (const fileName of chapterFiles) {
        const content = await indexedDBService.getChapterContent(bookId, fileName);
        if (content !== null) {
          chapters[fileName] = content;
        }
      }

      // Export to cloud
      await googleDriveService.exportBook(bookId, bookInfo, chapters);

      // Update local book status
      book.source = book.source === "local" ? "cloud" : book.source;
      book.syncStatus = "in_sync";
      book.cloudLastModified = book.localLastModified;
      book.cloudFolderPath = bookId;

      await indexedDBService.saveBook(book);

      // Mark all chapters as synced
      for (const fileName of chapterFiles) {
        await indexedDBService.markAsSynced("chapter", `${bookId}:${fileName}`);
      }

      // Clear any pending changes for this book to prevent legacy sync issues
      await indexedDBService.clearPendingChangesForBook(bookId);
    } catch (error) {
      console.error("Failed to export book to cloud:", error);
      throw error;
    }
  }

  async syncBookWithCloud(bookId: string, direction: "push" | "pull"): Promise<void> {
    if (!googleAuth.signedIn) {
      throw new Error("Must be signed in to sync with cloud");
    }

    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    if (book.source === "local") {
      throw new Error("Cannot sync local-only book. Export to cloud first.");
    }

    try {
      await googleDriveService.initialize();

      if (direction === "push") {
        // Push local changes to cloud
        await this.exportBookToCloud(bookId);
      } else {
        // Pull cloud changes to local
        await this.pullBookFromCloud(bookId);
      }
    } catch (error) {
      console.error(`Failed to sync book ${direction}:`, error);
      throw error;
    }
  }

  private async pullBookFromCloud(bookId: string): Promise<void> {
    const cloudBookData = await googleDriveService.importBook(bookId);
    if (!cloudBookData) {
      throw new Error(`Book with ID ${bookId} not found in cloud`);
    }

    const { bookInfo, chapters } = cloudBookData;
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found locally`);
    }

    // Update local book with cloud data
    book.name = bookInfo.name;
    book.config = bookInfo.config;
    book.version = bookInfo.version;
    book.cloudLastModified = bookInfo.lastModified;
    book.localLastModified = Date.now();
    book.syncStatus = "in_sync";

    await indexedDBService.saveBook(book);

    // Update all chapters
    const localChapterFiles = await indexedDBService.listChapterFiles(bookId);

    // Delete chapters that no longer exist in cloud
    for (const fileName of localChapterFiles) {
      if (!(fileName in chapters)) {
        await indexedDBService.deleteChapterContent(bookId, fileName);
      }
    }

    // Update/create chapters from cloud
    for (const [fileName, content] of Object.entries(chapters)) {
      await indexedDBService.saveChapterContent(bookId, fileName, content);
      await indexedDBService.markAsSynced("chapter", `${bookId}:${fileName}`);
    }
  }

  // Utility methods
  async getBookByName(name: string): Promise<BookEntry | null> {
    const books = await indexedDBService.listBooks();
    return books.find((book) => book.name === name) || null;
  }

  async duplicateBook(sourceBookId: string, newName: string): Promise<string> {
    const sourceBook = await this.getBook(sourceBookId);
    if (!sourceBook) {
      throw new Error(`Source book with id ${sourceBookId} not found`);
    }

    // Create new local book with the same config
    const newBookId = await this.createLocalBook(newName);
    await this.updateBookConfig(newBookId, sourceBook.config);

    // Copy all chapters
    const chapterFiles = await indexedDBService.listChapterFiles(sourceBookId);
    for (const fileName of chapterFiles) {
      const content = await indexedDBService.getChapterContent(sourceBookId, fileName);
      if (content) {
        await indexedDBService.saveChapterContent(newBookId, fileName, content);
      }
    }

    return newBookId;
  }

  async renameBook(bookId: string, newName: string): Promise<void> {
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    // Check if new name already exists
    const existingBook = await this.getBookByName(newName);
    if (existingBook && existingBook.id !== bookId) {
      throw new Error(`A book with the name "${newName}" already exists`);
    }

    book.name = newName;
    book.localLastModified = Date.now();

    // Update sync status if it's a cloud/imported book
    if (book.source === "imported" || book.source === "cloud") {
      book.syncStatus = "out_of_sync";
    }

    await indexedDBService.saveBook(book);
  }

  // Statistics and info
  async getBookStats(): Promise<{
    total: number;
    local: number;
    cloud: number;
    imported: number;
    outOfSync: number;
  }> {
    const books = await this.listBooks();

    return {
      total: books.length,
      local: books.filter((b) => b.source === "local").length,
      cloud: books.filter((b) => b.source === "cloud").length,
      imported: books.filter((b) => b.source === "imported").length,
      outOfSync: books.filter((b) => b.syncStatus === "out_of_sync").length,
    };
  }

  // Chapter operations (delegated to indexedDBService but with book validation)
  async getChapterContent(bookId: string, fileName: string): Promise<string | null> {
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }
    return await indexedDBService.getChapterContent(bookId, fileName);
  }

  async saveChapterContent(bookId: string, fileName: string, content: string): Promise<void> {
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }
    await indexedDBService.saveChapterContent(bookId, fileName, content);
  }

  async deleteChapterContent(bookId: string, fileName: string): Promise<void> {
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }
    await indexedDBService.deleteChapterContent(bookId, fileName);
  }

  async listChapterFiles(bookId: string): Promise<string[]> {
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }
    return await indexedDBService.listChapterFiles(bookId);
  }

  // Cloud sync helpers
  async checkCloudConnection(): Promise<boolean> {
    try {
      if (!googleAuth.signedIn) {
        return false;
      }
      await googleDriveService.initialize();
      return true;
    } catch (error) {
      return false;
    }
  }

  async syncAllOutOfSyncBooks(): Promise<{ success: string[]; failed: string[] }> {
    const outOfSyncBooks = await this.listOutOfSyncBooks();
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (const book of outOfSyncBooks) {
      try {
        await this.syncBookWithCloud(book.id, "push"); // Default to push
        results.success.push(book.name);
      } catch (error) {
        console.error(`Failed to sync book ${book.name}:`, error);
        results.failed.push(book.name);
      }
    }

    return results;
  }
}

// Create singleton instance
export const bookManagerService = new BookManagerService();
