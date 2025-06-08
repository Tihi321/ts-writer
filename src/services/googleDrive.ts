import { googleAuth } from "./googleAuth";
import { GOOGLE_CONFIG } from "../config/google";
import { CloudBooksIndex, BookInfo, BookConfig } from "./indexedDB";

const MIME_TYPES = GOOGLE_CONFIG.MIME_TYPES;

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  parents?: string[];
}

class GoogleDriveService {
  private appFolderId: string | null = null;

  async initialize(): Promise<void> {
    // Ensure Google Auth is initialized
    await googleAuth.initialize();

    if (!googleAuth.signedIn) {
      throw new Error("User must be signed in to use Google Drive");
    }

    // Find or create the app folder
    await this.ensureAppFolder();
  }

  private async makeApiRequest(
    path: string,
    method: string = "GET",
    body?: any,
    params?: Record<string, string>,
    isMultipart: boolean = false
  ): Promise<any> {
    const token = await googleAuth.ensureValidToken();

    let url = path;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    const requestInit: RequestInit = {
      method,
      headers,
    };

    if (body) {
      if (typeof body === "string") {
        requestInit.body = body;
        if (isMultipart) {
          // For multipart uploads, set the correct Content-Type with boundary
          headers["Content-Type"] = "multipart/related; boundary=-------314159265358979323846";
        }
      } else {
        headers["Content-Type"] = "application/json";
        requestInit.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, requestInit);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  private async ensureAppFolder(): Promise<string> {
    if (this.appFolderId) return this.appFolderId;

    // Search for existing app folder
    const searchResponse = await this.makeApiRequest(
      "https://www.googleapis.com/drive/v3/files",
      "GET",
      undefined,
      {
        q: `name='${GOOGLE_CONFIG.APP_FOLDER_NAME}' and mimeType='${MIME_TYPES.FOLDER}' and trashed=false`,
        fields: "files(id, name)",
      }
    );

    const folders = searchResponse.files;

    if (folders && folders.length > 0) {
      this.appFolderId = folders[0].id;
      return this.appFolderId!;
    }

    // Create app folder if it doesn't exist
    const createResponse = await this.makeApiRequest(
      "https://www.googleapis.com/drive/v3/files",
      "POST",
      {
        name: GOOGLE_CONFIG.APP_FOLDER_NAME,
        mimeType: MIME_TYPES.FOLDER,
      }
    );

    this.appFolderId = createResponse.id;
    return this.appFolderId!;
  }

  // New cloud structure methods

  /**
   * Get the books.json index from cloud root
   */
  async getCloudBooksIndex(): Promise<CloudBooksIndex | null> {
    const appFolderId = await this.ensureAppFolder();
    const booksIndexFile = await this.findFileInFolder(appFolderId, "books.json", MIME_TYPES.JSON);

    if (!booksIndexFile) {
      // Return empty index if file doesn't exist
      return {
        books: {},
        lastUpdated: Date.now(),
      };
    }

    const response = await this.makeApiRequest(
      `https://www.googleapis.com/drive/v3/files/${booksIndexFile.id}?alt=media`,
      "GET"
    );

    // makeApiRequest already parses JSON responses, so no need to parse again
    return response;
  }

  /**
   * Update the books.json index in cloud root
   */
  async updateCloudBooksIndex(index: CloudBooksIndex): Promise<void> {
    const appFolderId = await this.ensureAppFolder();
    const existingFile = await this.findFileInFolder(appFolderId, "books.json", MIME_TYPES.JSON);

    index.lastUpdated = Date.now();
    const content = JSON.stringify(index, null, 2);

    if (existingFile) {
      // Update existing file
      const updateMetadata = {
        name: "books.json",
        mimeType: MIME_TYPES.JSON,
      };

      await this.makeApiRequest(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
        "PATCH",
        this.createMultipartBody(updateMetadata, content),
        undefined,
        true
      );
    } else {
      // Create new file
      const createMetadata = {
        name: "books.json",
        parents: [appFolderId],
        mimeType: MIME_TYPES.JSON,
      };

      await this.makeApiRequest(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        "POST",
        this.createMultipartBody(createMetadata, content),
        undefined,
        true
      );
    }
  }

  /**
   * Create a book folder with the new structure
   */
  async createBookFolderWithId(bookId: string, bookName: string): Promise<string> {
    const appFolderId = await this.ensureAppFolder();

    // Use bookId as folder name for uniqueness
    const folderName = `${bookId}`;

    // Check if book folder already exists
    const existingFolder = await this.findFileInFolder(appFolderId, folderName, MIME_TYPES.FOLDER);
    if (existingFolder) {
      return existingFolder.id;
    }

    // Create book folder
    const response = await this.makeApiRequest(
      "https://www.googleapis.com/drive/v3/files",
      "POST",
      {
        name: folderName,
        mimeType: MIME_TYPES.FOLDER,
        parents: [appFolderId],
      }
    );

    return response.id;
  }

  /**
   * Save book info.json in the book folder
   */
  async saveBookInfo(bookId: string, bookInfo: BookInfo): Promise<void> {
    const bookFolderId = await this.createBookFolderWithId(bookId, bookInfo.name);

    // Check if info.json already exists
    const existingFile = await this.findFileInFolder(bookFolderId, "info.json", MIME_TYPES.JSON);

    const content = JSON.stringify(bookInfo, null, 2);

    if (existingFile) {
      // Update existing file
      const updateMetadata = {
        name: "info.json",
        mimeType: MIME_TYPES.JSON,
      };

      await this.makeApiRequest(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
        "PATCH",
        this.createMultipartBody(updateMetadata, content),
        undefined,
        true
      );
    } else {
      // Create new file
      const createMetadata = {
        name: "info.json",
        parents: [bookFolderId],
        mimeType: MIME_TYPES.JSON,
      };

      await this.makeApiRequest(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        "POST",
        this.createMultipartBody(createMetadata, content),
        undefined,
        true
      );
    }
  }

  /**
   * Get book info.json from the book folder
   */
  async getBookInfo(bookId: string): Promise<BookInfo | null> {
    const appFolderId = await this.ensureAppFolder();
    const bookFolder = await this.findFileInFolder(appFolderId, bookId, MIME_TYPES.FOLDER);

    if (!bookFolder) return null;

    const infoFile = await this.findFileInFolder(bookFolder.id, "info.json", MIME_TYPES.JSON);
    if (!infoFile) return null;

    const response = await this.makeApiRequest(
      `https://www.googleapis.com/drive/v3/files/${infoFile.id}?alt=media`,
      "GET"
    );

    // makeApiRequest already parses JSON responses, so no need to parse again
    return response;
  }

  /**
   * Export a complete book to cloud (new structure)
   */
  async exportBook(
    bookId: string,
    bookInfo: BookInfo,
    chapters: { [fileName: string]: string }
  ): Promise<void> {
    // 1. Create book folder
    const bookFolderId = await this.createBookFolderWithId(bookId, bookInfo.name);

    // 2. Save book info.json
    await this.saveBookInfo(bookId, bookInfo);

    // 3. Create chapters folder
    const chaptersFolderId = await this.createChaptersFolder(bookFolderId);

    // 4. Save all chapters
    for (const [fileName, content] of Object.entries(chapters)) {
      await this.saveChapterContentInFolder(chaptersFolderId, fileName, content);
    }

    // 5. Update books.json index
    const booksIndex = (await this.getCloudBooksIndex()) || { books: {}, lastUpdated: Date.now() };
    booksIndex.books[bookId] = {
      name: bookInfo.name,
      folderPath: bookId,
      lastModified: bookInfo.lastModified,
      version: bookInfo.version,
    };

    await this.updateCloudBooksIndex(booksIndex);
  }

  /**
   * Import a complete book from cloud (new structure)
   */
  async importBook(
    bookId: string
  ): Promise<{ bookInfo: BookInfo; chapters: { [fileName: string]: string } } | null> {
    // 1. Get book info
    const bookInfo = await this.getBookInfo(bookId);
    if (!bookInfo) return null;

    // 2. Get book folder
    const appFolderId = await this.ensureAppFolder();
    const bookFolder = await this.findFileInFolder(appFolderId, bookId, MIME_TYPES.FOLDER);
    if (!bookFolder) return null;

    // 3. Get chapters folder
    const chaptersFolder = await this.findFileInFolder(
      bookFolder.id,
      "chapters",
      MIME_TYPES.FOLDER
    );
    if (!chaptersFolder) {
      // No chapters folder, return book with empty chapters
      return { bookInfo, chapters: {} };
    }

    // 4. Get all chapter files
    const chapterFiles = await this.listChapterFilesInFolder(chaptersFolder.id);
    const chapters: { [fileName: string]: string } = {};

    for (const fileName of chapterFiles) {
      const content = await this.getChapterContentFromFolder(chaptersFolder.id, fileName);
      if (content !== null) {
        chapters[fileName] = content;
      }
    }

    return { bookInfo, chapters };
  }

  /**
   * Delete a book from cloud (new structure)
   */
  async deleteBookFromCloud(bookId: string): Promise<void> {
    // 1. Delete book folder
    const appFolderId = await this.ensureAppFolder();
    const bookFolder = await this.findFileInFolder(appFolderId, bookId, MIME_TYPES.FOLDER);

    if (bookFolder) {
      await this.makeApiRequest(
        `https://www.googleapis.com/drive/v3/files/${bookFolder.id}`,
        "DELETE"
      );
    }

    // 2. Update books.json index
    const booksIndex = await this.getCloudBooksIndex();
    if (booksIndex && booksIndex.books[bookId]) {
      delete booksIndex.books[bookId];
      await this.updateCloudBooksIndex(booksIndex);
    }
  }

  // Enhanced chapter operations for new structure

  async saveChapterContentWithBookId(
    bookId: string,
    fileName: string,
    content: string
  ): Promise<void> {
    const appFolderId = await this.ensureAppFolder();
    const bookFolder = await this.findFileInFolder(appFolderId, bookId, MIME_TYPES.FOLDER);

    if (!bookFolder) {
      throw new Error(`Book folder not found for book ID: ${bookId}`);
    }

    const chaptersFolderId = await this.createChaptersFolder(bookFolder.id);
    await this.saveChapterContentInFolder(chaptersFolderId, fileName, content);
  }

  async getChapterContentWithBookId(bookId: string, fileName: string): Promise<string | null> {
    const appFolderId = await this.ensureAppFolder();
    const bookFolder = await this.findFileInFolder(appFolderId, bookId, MIME_TYPES.FOLDER);

    if (!bookFolder) return null;

    const chaptersFolder = await this.findFileInFolder(
      bookFolder.id,
      "chapters",
      MIME_TYPES.FOLDER
    );
    if (!chaptersFolder) return null;

    return await this.getChapterContentFromFolder(chaptersFolder.id, fileName);
  }

  async deleteChapterFileWithBookId(bookId: string, fileName: string): Promise<void> {
    const appFolderId = await this.ensureAppFolder();
    const bookFolder = await this.findFileInFolder(appFolderId, bookId, MIME_TYPES.FOLDER);

    if (!bookFolder) return;

    const chaptersFolder = await this.findFileInFolder(
      bookFolder.id,
      "chapters",
      MIME_TYPES.FOLDER
    );
    if (!chaptersFolder) return;

    const chapterFile = await this.findFileInFolder(
      chaptersFolder.id,
      fileName,
      MIME_TYPES.MARKDOWN
    );
    if (!chapterFile) return;

    await this.makeApiRequest(
      `https://www.googleapis.com/drive/v3/files/${chapterFile.id}`,
      "DELETE"
    );
  }

  async listChapterFilesWithBookId(bookId: string): Promise<string[]> {
    const appFolderId = await this.ensureAppFolder();
    const bookFolder = await this.findFileInFolder(appFolderId, bookId, MIME_TYPES.FOLDER);

    if (!bookFolder) return [];

    const chaptersFolder = await this.findFileInFolder(
      bookFolder.id,
      "chapters",
      MIME_TYPES.FOLDER
    );
    if (!chaptersFolder) return [];

    return await this.listChapterFilesInFolder(chaptersFolder.id);
  }

  // Helper methods for chapter operations

  private async saveChapterContentInFolder(
    chaptersFolderId: string,
    fileName: string,
    content: string
  ): Promise<void> {
    // Check if chapter file already exists
    const existingFile = await this.findFileInFolder(
      chaptersFolderId,
      fileName,
      MIME_TYPES.MARKDOWN
    );

    if (existingFile) {
      // Update existing file
      const updateMetadata = {
        name: fileName,
        mimeType: MIME_TYPES.MARKDOWN,
      };

      await this.makeApiRequest(
        `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
        "PATCH",
        this.createMultipartBody(updateMetadata, content),
        undefined,
        true
      );
    } else {
      // Create new file
      const createMetadata = {
        name: fileName,
        parents: [chaptersFolderId],
        mimeType: MIME_TYPES.MARKDOWN,
      };

      await this.makeApiRequest(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        "POST",
        this.createMultipartBody(createMetadata, content),
        undefined,
        true
      );
    }
  }

  private async getChapterContentFromFolder(
    chaptersFolderId: string,
    fileName: string
  ): Promise<string | null> {
    const chapterFile = await this.findFileInFolder(
      chaptersFolderId,
      fileName,
      MIME_TYPES.MARKDOWN
    );
    if (!chapterFile) return null;

    const response = await this.makeApiRequest(
      `https://www.googleapis.com/drive/v3/files/${chapterFile.id}?alt=media`,
      "GET"
    );

    return response;
  }

  private async listChapterFilesInFolder(chaptersFolderId: string): Promise<string[]> {
    const response = await this.makeApiRequest(
      "https://www.googleapis.com/drive/v3/files",
      "GET",
      undefined,
      {
        q: `'${chaptersFolderId}' in parents and mimeType='${MIME_TYPES.MARKDOWN}' and trashed=false`,
        fields: "files(name)",
      }
    );

    const files = response.files || [];
    return files.map((file: any) => file.name);
  }

  // Helper methods used by current functionality
  private async findFileInFolder(
    folderId: string,
    fileName: string,
    mimeType?: string
  ): Promise<DriveFile | null> {
    let query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
    if (mimeType) {
      query += ` and mimeType='${mimeType}'`;
    }

    const response = await this.makeApiRequest(
      "https://www.googleapis.com/drive/v3/files",
      "GET",
      undefined,
      {
        q: query,
        fields: "files(id, name, mimeType, modifiedTime, parents)",
      }
    );

    const files = response.files;
    return files && files.length > 0 ? files[0] : null;
  }

  private async createChaptersFolder(bookFolderId: string): Promise<string> {
    // Check if chapters folder already exists
    const existingFolder = await this.findFileInFolder(bookFolderId, "chapters", MIME_TYPES.FOLDER);
    if (existingFolder) {
      return existingFolder.id;
    }

    // Create chapters folder
    const response = await this.makeApiRequest(
      "https://www.googleapis.com/drive/v3/files",
      "POST",
      {
        name: "chapters",
        mimeType: MIME_TYPES.FOLDER,
        parents: [bookFolderId],
      }
    );

    return response.id;
  }

  private createMultipartBody(metadata: any, content: string): string {
    const delimiter = "-------314159265358979323846";
    const close_delim = `\r\n--${delimiter}--`;

    let body = `--${delimiter}\r\n`;
    body += "Content-Type: application/json\r\n\r\n";
    body += JSON.stringify(metadata) + "\r\n";
    body += `--${delimiter}\r\n`;
    body += `Content-Type: ${metadata.mimeType}\r\n\r\n`;
    body += content;
    body += close_delim;

    return body;
  }
}

// Create singleton instance
export const googleDriveService = new GoogleDriveService();
