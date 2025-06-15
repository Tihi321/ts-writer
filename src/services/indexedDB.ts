import { openDB, DBSchema, IDBPDatabase } from "idb";

// Cloud books.json structure
export interface CloudBooksIndex {
  books: {
    [bookId: string]: {
      name: string;
      folderPath: string;
      lastModified: number;
      version: string;
    };
  };
  lastUpdated: number;
}

// Book info.json structure (stored in each book folder)
export interface BookInfo {
  id: string;
  name: string;
  version: string;
  createdAt: number;
  lastModified: number;
  config: BookConfig;
}

// Enhanced book entry for database
export interface BookEntry {
  id: string;
  name: string;
  source: "local" | "cloud";
  syncStatus: "in_sync" | "out_of_sync" | "local_only" | "cloud_only";
  config: BookConfig;
  localLastModified: number;
  cloudLastModified?: number;
  cloudFolderPath?: string;
  version: string;
}

// Define the database schema
interface TSWriterDB extends DBSchema {
  books: {
    key: string; // book id
    value: BookEntry;
  };
  chapters: {
    key: string; // `${bookId}:${fileName}`
    value: {
      key: string;
      bookId: string;
      fileName: string;
      content: string;
      lastModified: number;
      syncStatus: "synced" | "pending" | "conflict";
    };
    indexes: { bookId: string };
  };
  syncMetadata: {
    key: string; // file path in Google Drive
    value: {
      key: string;
      driveFileId: string;
      lastSyncTime: number;
      localLastModified: number;
      driveLastModified: number;
    };
  };
  appConfig: {
    key: string; // config key
    value: {
      key: string;
      value: any;
      lastModified: number;
    };
  };
}

// Types matching the backend data structure
export interface Idea {
  id: string;
  text: string;
  order: number;
}

export interface Chapter {
  id: string;
  title: string;
  fileName: string;
}

export interface BookConfig {
  chapters: Chapter[];
  chapterOrder: string[];
  ideas: Record<string, Idea[]>;
}

class IndexedDBService {
  private db: IDBPDatabase<TSWriterDB> | null = null;
  private readonly DB_NAME = "TSWriterDB";
  private readonly DB_VERSION = 3; // Incremented for schema change

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<TSWriterDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion) {
        // Create books store
        if (!db.objectStoreNames.contains("books")) {
          db.createObjectStore("books", { keyPath: "id" });
        }

        // Create chapters store
        if (!db.objectStoreNames.contains("chapters")) {
          const chaptersStore = db.createObjectStore("chapters", { keyPath: "key" });
          chaptersStore.createIndex("bookId", "bookId");
        }

        // Create sync metadata store
        if (!db.objectStoreNames.contains("syncMetadata")) {
          db.createObjectStore("syncMetadata", { keyPath: "key" });
        }

        // Create app config store
        if (!db.objectStoreNames.contains("appConfig")) {
          db.createObjectStore("appConfig", { keyPath: "key" });
        }

        // Migration logic for existing data
        if (oldVersion < 3) {
          console.log("Migrating database to version 3...");
          // Legacy data will be fixed after initialization
        }
      },
    });

    // Check if the database schema is correct
    await this.validateAndFixSchema();
  }

  private ensureDB(): IDBPDatabase<TSWriterDB> {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  // Enhanced book operations
  async listBooks(): Promise<BookEntry[]> {
    const db = this.ensureDB();
    return await db.getAll("books");
  }

  async listLocalBooks(): Promise<BookEntry[]> {
    const books = await this.listBooks();
    return books.filter((book) => book.source === "local");
  }

  async listCloudBooks(): Promise<BookEntry[]> {
    const books = await this.listBooks();
    return books.filter((book) => book.source === "cloud");
  }

  async getBook(bookId: string): Promise<BookEntry | null> {
    const db = this.ensureDB();
    try {
      return (await db.get("books", bookId)) || null;
    } catch (error) {
      console.error(`[IndexedDB] Error in getBook:`, error);
      throw error;
    }
  }

  async getBookConfig(bookId: string): Promise<BookConfig | null> {
    const book = await this.getBook(bookId);
    return book?.config || null;
  }

  async saveBook(book: BookEntry): Promise<void> {
    const db = this.ensureDB();
    try {
      await db.put("books", book);
    } catch (error) {
      console.error(`[IndexedDB] Error saving book:`, error);
      throw error;
    }
  }

  async createLocalBook(name: string): Promise<string> {
    const bookId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const defaultConfig: BookConfig = {
      chapters: [],
      chapterOrder: [],
      ideas: {},
    };

    const book: BookEntry = {
      id: bookId,
      name,
      source: "local",
      syncStatus: "local_only",
      config: defaultConfig,
      localLastModified: Date.now(),
      version: "1.0.0",
    };

    await this.saveBook(book);
    return bookId;
  }

  async updateBookConfig(bookId: string, config: BookConfig): Promise<void> {
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    book.config = config;
    book.localLastModified = Date.now();

    // Update sync status based on source
    if (book.source === "cloud") {
      book.syncStatus = "out_of_sync";
    }

    await this.saveBook(book);
  }

  async deleteBook(bookId: string): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(["books", "chapters"], "readwrite");

    // Delete book
    await tx.objectStore("books").delete(bookId);

    // Delete all chapters for this book
    const chaptersStore = tx.objectStore("chapters");
    const chapters = await chaptersStore.index("bookId").getAll(bookId);

    for (const chapter of chapters) {
      await chaptersStore.delete(chapter.key);
    }

    await tx.done;
  }

  async updateBookSyncStatus(
    bookId: string,
    syncStatus: BookEntry["syncStatus"],
    cloudLastModified?: number
  ): Promise<void> {
    const book = await this.getBook(bookId);
    if (!book) {
      throw new Error(`Book with id ${bookId} not found`);
    }

    book.syncStatus = syncStatus;
    if (cloudLastModified !== undefined) {
      book.cloudLastModified = cloudLastModified;
    }

    await this.saveBook(book);
  }

  // Chapter operations (updated to use bookId instead of bookName)
  async getChapterContent(bookId: string, fileName: string): Promise<string | null> {
    const db = this.ensureDB();
    const key = `${bookId}:${fileName}`;
    const chapter = await db.get("chapters", key);
    return chapter?.content || null;
  }

  async saveChapterContent(
    bookId: string,
    fileName: string,
    content: string,
    isSync: boolean = false
  ): Promise<void> {
    const db = this.ensureDB();
    const key = `${bookId}:${fileName}`;
    const now = Date.now();

    await db.put("chapters", {
      key,
      bookId,
      fileName,
      content,
      lastModified: now,
      syncStatus: isSync ? "synced" : "pending",
    });

    // Update book's last modified time and sync status
    const book = await this.getBook(bookId);
    if (book) {
      book.localLastModified = now;
      // Only mark as out of sync if this is not a sync operation
      if (!isSync && book.source === "cloud") {
        book.syncStatus = "out_of_sync";
      }
      await this.saveBook(book);
    }
  }

  async deleteChapterContent(bookId: string, fileName: string): Promise<void> {
    const db = this.ensureDB();
    const key = `${bookId}:${fileName}`;
    await db.delete("chapters", key);
  }

  async listChapterFiles(bookId: string): Promise<string[]> {
    const db = this.ensureDB();
    const chapters = await db.getAllFromIndex("chapters", "bookId", bookId);
    return chapters.map((chapter) => chapter.fileName);
  }

  // Sync metadata operations
  async getSyncMetadata(filePath: string): Promise<{
    driveFileId: string;
    lastSyncTime: number;
    localLastModified: number;
    driveLastModified: number;
  } | null> {
    const db = this.ensureDB();
    const result = await db.get("syncMetadata", filePath);
    return result || null;
  }

  async setSyncMetadata(
    filePath: string,
    metadata: {
      driveFileId: string;
      lastSyncTime: number;
      localLastModified: number;
      driveLastModified: number;
    }
  ): Promise<void> {
    const db = this.ensureDB();
    await db.put("syncMetadata", {
      key: filePath,
      ...metadata,
    });
  }

  async deleteSyncMetadata(filePath: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete("syncMetadata", filePath);
  }

  // Utility methods for sync status
  async getPendingChanges(): Promise<{
    books: string[];
    chapters: { bookId: string; fileName: string }[];
  }> {
    const db = this.ensureDB();

    const pendingBooks = await db.getAll("books");
    const pendingChapters = await db.getAll("chapters");

    return {
      books: pendingBooks
        .filter((book) => book.syncStatus === "out_of_sync")
        .map((book) => book.name),
      chapters: pendingChapters
        .filter((chapter) => chapter.syncStatus === "pending")
        .map((chapter) => ({ bookId: chapter.bookId, fileName: chapter.fileName })),
    };
  }

  async markAsSynced(type: "book" | "chapter", key: string): Promise<void> {
    const db = this.ensureDB();

    if (type === "book") {
      const book = await db.get("books", key);
      if (book) {
        book.syncStatus = "in_sync";
        await db.put("books", book);
      }
    } else {
      const chapter = await db.get("chapters", key);
      if (chapter) {
        chapter.syncStatus = "synced";
        await db.put("chapters", chapter);
      }
    }
  }

  async clearPendingChangesForBook(bookId: string): Promise<void> {
    const db = this.ensureDB();

    // Mark all chapters for this book as synced
    const chapters = await db.getAllFromIndex("chapters", "bookId", bookId);
    const tx = db.transaction(["chapters"], "readwrite");

    for (const chapter of chapters) {
      if (chapter.syncStatus === "pending") {
        chapter.syncStatus = "synced";
        await tx.objectStore("chapters").put(chapter);
      }
    }

    await tx.done;
  }

  // App configuration operations
  async getAppConfig(key: string): Promise<any> {
    const db = this.ensureDB();
    const result = await db.get("appConfig", key);
    return result?.value || null;
  }

  async setAppConfig(key: string, value: any): Promise<void> {
    const db = this.ensureDB();
    const now = Date.now();

    await db.put("appConfig", {
      key,
      value,
      lastModified: now,
    });
  }

  async deleteAppConfig(key: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete("appConfig", key);
  }

  // Google API configuration helpers
  async getGoogleClientId(): Promise<string | null> {
    return await this.getAppConfig("google_client_id");
  }

  async setGoogleClientId(clientId: string): Promise<void> {
    await this.setAppConfig("google_client_id", clientId);
  }

  async getGoogleApiKey(): Promise<string | null> {
    return await this.getAppConfig("google_api_key");
  }

  async setGoogleApiKey(apiKey: string): Promise<void> {
    await this.setAppConfig("google_api_key", apiKey);
  }

  // Clear all data (for migration purposes)
  async clearAllData(): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(["books", "chapters", "syncMetadata", "appConfig"], "readwrite");

    await tx.objectStore("books").clear();
    await tx.objectStore("chapters").clear();
    await tx.objectStore("syncMetadata").clear();
    await tx.objectStore("appConfig").clear();

    await tx.done;
  }

  // Clear all books and chapters only
  async clearAllBooks(): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(["books", "chapters"], "readwrite");

    await tx.objectStore("books").clear();
    await tx.objectStore("chapters").clear();

    await tx.done;
  }

  // Clear all app configuration
  async clearAllConfig(): Promise<void> {
    const db = this.ensureDB();
    await db.clear("appConfig");
  }

  private async validateAndFixSchema(): Promise<void> {
    try {
      const db = this.ensureDB();

      // Check if books store has the correct keyPath
      const transaction = db.transaction(["books"], "readonly");
      const booksStore = transaction.objectStore("books");

      console.log(`[IndexedDB] Validating schema - Books store keyPath: "${booksStore.keyPath}"`);

      if (booksStore.keyPath !== "id") {
        console.error(
          `[IndexedDB] SCHEMA ERROR: Books store has wrong keyPath: "${booksStore.keyPath}", expected: "id"`
        );
        console.log(`[IndexedDB] Database needs to be recreated with correct schema`);

        // Close the current database
        db.close();
        this.db = null;

        // Delete the database to force recreation
        console.log(`[IndexedDB] Deleting database to fix schema...`);
        await new Promise<void>((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(this.DB_NAME);
          deleteRequest.onsuccess = () => {
            console.log(`[IndexedDB] Database deleted successfully`);
            resolve();
          };
          deleteRequest.onerror = () => {
            console.error(`[IndexedDB] Failed to delete database:`, deleteRequest.error);
            reject(deleteRequest.error);
          };
        });

        // Recreate the database with correct schema
        console.log(`[IndexedDB] Recreating database with correct schema...`);
        this.db = await openDB<TSWriterDB>(this.DB_NAME, this.DB_VERSION, {
          upgrade(db, oldVersion) {
            console.log(`[IndexedDB] Creating fresh database with correct schema`);

            // Create books store with correct keyPath
            if (!db.objectStoreNames.contains("books")) {
              const booksStore = db.createObjectStore("books", { keyPath: "id" });
              console.log(`[IndexedDB] Created books store with keyPath: "id"`);
            }

            // Create chapters store
            if (!db.objectStoreNames.contains("chapters")) {
              const chaptersStore = db.createObjectStore("chapters", { keyPath: "key" });
              chaptersStore.createIndex("bookId", "bookId");
              console.log(`[IndexedDB] Created chapters store`);
            }

            // Create sync metadata store
            if (!db.objectStoreNames.contains("syncMetadata")) {
              db.createObjectStore("syncMetadata", { keyPath: "key" });
              console.log(`[IndexedDB] Created syncMetadata store`);
            }

            // Create app config store
            if (!db.objectStoreNames.contains("appConfig")) {
              db.createObjectStore("appConfig", { keyPath: "key" });
              console.log(`[IndexedDB] Created appConfig store`);
            }
          },
        });

        console.log(`[IndexedDB] Database recreated successfully with correct schema`);
      } else {
        console.log(`[IndexedDB] Schema validation passed - keyPath is correct`);
      }
    } catch (error) {
      console.error(`[IndexedDB] Error validating schema:`, error);
      // Don't throw - this is a best-effort fix
    }
  }
}

// Create singleton instance
export const indexedDBService = new IndexedDBService();
