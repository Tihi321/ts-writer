import { openDB, DBSchema, IDBPDatabase } from "idb";

// Define the database schema
interface TSWriterDB extends DBSchema {
  books: {
    key: string; // book name
    value: {
      name: string;
      config: BookConfig;
      lastModified: number;
      syncStatus: "synced" | "pending" | "conflict";
    };
  };
  chapters: {
    key: string; // `${bookName}:${fileName}`
    value: {
      key: string;
      bookName: string;
      fileName: string;
      content: string;
      lastModified: number;
      syncStatus: "synced" | "pending" | "conflict";
    };
    indexes: { bookName: string };
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
  private readonly DB_VERSION = 2; // Incremented for schema change

  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<TSWriterDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create books store
        if (!db.objectStoreNames.contains("books")) {
          db.createObjectStore("books", { keyPath: "name" });
        }

        // Create chapters store
        if (!db.objectStoreNames.contains("chapters")) {
          const chaptersStore = db.createObjectStore("chapters", { keyPath: "key" });
          chaptersStore.createIndex("bookName", "bookName");
        }

        // Create sync metadata store
        if (!db.objectStoreNames.contains("syncMetadata")) {
          db.createObjectStore("syncMetadata", { keyPath: "key" });
        }

        // Create app config store
        if (!db.objectStoreNames.contains("appConfig")) {
          db.createObjectStore("appConfig", { keyPath: "key" });
        }
      },
    });
  }

  private ensureDB(): IDBPDatabase<TSWriterDB> {
    if (!this.db) {
      throw new Error("Database not initialized. Call initialize() first.");
    }
    return this.db;
  }

  // Book operations
  async listBooks(): Promise<string[]> {
    const db = this.ensureDB();
    const books = await db.getAll("books");
    return books.map((book) => book.name);
  }

  async getBookConfig(bookName: string): Promise<BookConfig | null> {
    const db = this.ensureDB();
    const book = await db.get("books", bookName);
    return book?.config || null;
  }

  async saveBookConfig(bookName: string, config: BookConfig): Promise<void> {
    const db = this.ensureDB();
    const now = Date.now();

    await db.put("books", {
      name: bookName,
      config,
      lastModified: now,
      syncStatus: "pending",
    });
  }

  async createBook(bookName: string): Promise<void> {
    const defaultConfig: BookConfig = {
      chapters: [],
      chapterOrder: [],
      ideas: {},
    };

    await this.saveBookConfig(bookName, defaultConfig);
  }

  async deleteBook(bookName: string): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(["books", "chapters"], "readwrite");

    // Delete book
    await tx.objectStore("books").delete(bookName);

    // Delete all chapters for this book
    const chaptersStore = tx.objectStore("chapters");
    const chapters = await chaptersStore.index("bookName").getAll(bookName);

    for (const chapter of chapters) {
      await chaptersStore.delete(chapter.key);
    }

    await tx.done;
  }

  // Chapter operations
  async getChapterContent(bookName: string, fileName: string): Promise<string | null> {
    const db = this.ensureDB();
    const key = `${bookName}:${fileName}`;
    const chapter = await db.get("chapters", key);
    return chapter?.content || null;
  }

  async saveChapterContent(bookName: string, fileName: string, content: string): Promise<void> {
    const db = this.ensureDB();
    const key = `${bookName}:${fileName}`;
    const now = Date.now();

    await db.put("chapters", {
      key,
      bookName,
      fileName,
      content,
      lastModified: now,
      syncStatus: "pending",
    });
  }

  async deleteChapterContent(bookName: string, fileName: string): Promise<void> {
    const db = this.ensureDB();
    const key = `${bookName}:${fileName}`;
    await db.delete("chapters", key);
  }

  async listChapterFiles(bookName: string): Promise<string[]> {
    const db = this.ensureDB();
    const chapters = await db.getAllFromIndex("chapters", "bookName", bookName);
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
    chapters: { bookName: string; fileName: string }[];
  }> {
    const db = this.ensureDB();

    const pendingBooks = await db.getAll("books");
    const pendingChapters = await db.getAll("chapters");

    return {
      books: pendingBooks.filter((book) => book.syncStatus === "pending").map((book) => book.name),
      chapters: pendingChapters
        .filter((chapter) => chapter.syncStatus === "pending")
        .map((chapter) => ({ bookName: chapter.bookName, fileName: chapter.fileName })),
    };
  }

  async markAsSynced(type: "book" | "chapter", key: string): Promise<void> {
    const db = this.ensureDB();

    if (type === "book") {
      const book = await db.get("books", key);
      if (book) {
        book.syncStatus = "synced";
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
}

// Create singleton instance
export const indexedDBService = new IndexedDBService();
