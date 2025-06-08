import { googleAuth } from "./googleAuth";
import { GOOGLE_CONFIG } from "../config/google";

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

  async createBookFolder(bookName: string): Promise<string> {
    const appFolderId = await this.ensureAppFolder();

    // Check if book folder already exists
    const existingFolder = await this.findFileInFolder(appFolderId, bookName, MIME_TYPES.FOLDER);
    if (existingFolder) {
      return existingFolder.id;
    }

    // Create book folder
    const response = await this.makeApiRequest(
      "https://www.googleapis.com/drive/v3/files",
      "POST",
      {
        name: bookName,
        mimeType: MIME_TYPES.FOLDER,
        parents: [appFolderId],
      }
    );

    return response.id;
  }

  async createChaptersFolder(bookFolderId: string): Promise<string> {
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

  async listBooks(): Promise<string[]> {
    const appFolderId = await this.ensureAppFolder();

    const response = await this.makeApiRequest(
      "https://www.googleapis.com/drive/v3/files",
      "GET",
      undefined,
      {
        q: `'${appFolderId}' in parents and mimeType='${MIME_TYPES.FOLDER}' and trashed=false`,
        fields: "files(name)",
      }
    );

    const folders = response.files || [];
    return folders.map((folder: any) => folder.name);
  }

  async saveBookConfig(bookName: string, config: any): Promise<void> {
    const bookFolderId = await this.createBookFolder(bookName);

    // Check if book.json already exists
    const existingFile = await this.findFileInFolder(bookFolderId, "book.json", MIME_TYPES.JSON);

    const content = JSON.stringify(config, null, 2);

    if (existingFile) {
      // Update existing file - don't include parents field for updates
      const updateMetadata = {
        name: "book.json",
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
      // Create new file - include parents field for creation
      const createMetadata = {
        name: "book.json",
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

  async getBookConfig(bookName: string): Promise<any | null> {
    const bookFolderId = await this.createBookFolder(bookName);
    const configFile = await this.findFileInFolder(bookFolderId, "book.json", MIME_TYPES.JSON);

    if (!configFile) return null;

    const response = await this.makeApiRequest(
      `https://www.googleapis.com/drive/v3/files/${configFile.id}?alt=media`,
      "GET"
    );

    return JSON.parse(response);
  }

  async saveChapterContent(bookName: string, fileName: string, content: string): Promise<void> {
    const bookFolderId = await this.createBookFolder(bookName);
    const chaptersFolderId = await this.createChaptersFolder(bookFolderId);

    // Check if chapter file already exists
    const existingFile = await this.findFileInFolder(
      chaptersFolderId,
      fileName,
      MIME_TYPES.MARKDOWN
    );

    if (existingFile) {
      // Update existing file - don't include parents field for updates
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
      // Create new file - include parents field for creation
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

  async getChapterContent(bookName: string, fileName: string): Promise<string | null> {
    const bookFolderId = await this.createBookFolder(bookName);
    const chaptersFolderId = await this.createChaptersFolder(bookFolderId);
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

  async deleteChapterFile(bookName: string, fileName: string): Promise<void> {
    const bookFolderId = await this.createBookFolder(bookName);
    const chaptersFolderId = await this.createChaptersFolder(bookFolderId);
    const chapterFile = await this.findFileInFolder(
      chaptersFolderId,
      fileName,
      MIME_TYPES.MARKDOWN
    );

    if (!chapterFile) return;

    await this.makeApiRequest(
      `https://www.googleapis.com/drive/v3/files/${chapterFile.id}`,
      "DELETE"
    );
  }

  async listChapterFiles(bookName: string): Promise<string[]> {
    const bookFolderId = await this.createBookFolder(bookName);
    const chaptersFolderId = await this.createChaptersFolder(bookFolderId);

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

  async deleteBook(bookName: string): Promise<void> {
    const appFolderId = await this.ensureAppFolder();
    const bookFolder = await this.findFileInFolder(appFolderId, bookName, MIME_TYPES.FOLDER);

    if (!bookFolder) return;

    await this.makeApiRequest(
      `https://www.googleapis.com/drive/v3/files/${bookFolder.id}`,
      "DELETE"
    );
  }
}

// Create singleton instance
export const googleDriveService = new GoogleDriveService();
