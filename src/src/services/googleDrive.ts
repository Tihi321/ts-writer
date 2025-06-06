import { gapi } from "gapi-script";
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

  private async ensureAppFolder(): Promise<string> {
    if (this.appFolderId) return this.appFolderId;

    const token = await googleAuth.ensureValidToken();

    // Search for existing app folder
    const searchResponse = await gapi.client.request({
      path: "https://www.googleapis.com/drive/v3/files",
      method: "GET",
      params: {
        q: `name='${GOOGLE_CONFIG.APP_FOLDER_NAME}' and mimeType='${MIME_TYPES.FOLDER}' and trashed=false`,
        fields: "files(id, name)",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const folders = searchResponse.result.files;

    if (folders && folders.length > 0) {
      this.appFolderId = folders[0].id;
      return this.appFolderId!;
    }

    // Create app folder if it doesn't exist
    const createResponse = await gapi.client.request({
      path: "https://www.googleapis.com/drive/v3/files",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: GOOGLE_CONFIG.APP_FOLDER_NAME,
        mimeType: MIME_TYPES.FOLDER,
      }),
    });

    this.appFolderId = createResponse.result.id;
    return this.appFolderId!;
  }

  async createBookFolder(bookName: string): Promise<string> {
    const token = await googleAuth.ensureValidToken();
    const appFolderId = await this.ensureAppFolder();

    // Check if book folder already exists
    const existingFolder = await this.findFileInFolder(appFolderId, bookName, MIME_TYPES.FOLDER);
    if (existingFolder) {
      return existingFolder.id;
    }

    // Create book folder
    const response = await gapi.client.request({
      path: "https://www.googleapis.com/drive/v3/files",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: bookName,
        mimeType: MIME_TYPES.FOLDER,
        parents: [appFolderId],
      }),
    });

    return response.result.id;
  }

  async createChaptersFolder(bookFolderId: string): Promise<string> {
    const token = await googleAuth.ensureValidToken();

    // Check if chapters folder already exists
    const existingFolder = await this.findFileInFolder(bookFolderId, "chapters", MIME_TYPES.FOLDER);
    if (existingFolder) {
      return existingFolder.id;
    }

    // Create chapters folder
    const response = await gapi.client.request({
      path: "https://www.googleapis.com/drive/v3/files",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "chapters",
        mimeType: MIME_TYPES.FOLDER,
        parents: [bookFolderId],
      }),
    });

    return response.result.id;
  }

  private async findFileInFolder(
    folderId: string,
    fileName: string,
    mimeType?: string
  ): Promise<DriveFile | null> {
    const token = await googleAuth.ensureValidToken();

    let query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
    if (mimeType) {
      query += ` and mimeType='${mimeType}'`;
    }

    const response = await gapi.client.request({
      path: "https://www.googleapis.com/drive/v3/files",
      method: "GET",
      params: {
        q: query,
        fields: "files(id, name, mimeType, modifiedTime, parents)",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const files = response.result.files;
    return files && files.length > 0 ? files[0] : null;
  }

  async listBooks(): Promise<string[]> {
    const appFolderId = await this.ensureAppFolder();
    const token = await googleAuth.ensureValidToken();

    const response = await gapi.client.request({
      path: "https://www.googleapis.com/drive/v3/files",
      method: "GET",
      params: {
        q: `'${appFolderId}' in parents and mimeType='${MIME_TYPES.FOLDER}' and trashed=false`,
        fields: "files(name)",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const folders = response.result.files || [];
    return folders.map((folder: any) => folder.name);
  }

  async saveBookConfig(bookName: string, config: any): Promise<void> {
    const bookFolderId = await this.createBookFolder(bookName);
    const token = await googleAuth.ensureValidToken();

    // Check if book.json already exists
    const existingFile = await this.findFileInFolder(bookFolderId, "book.json", MIME_TYPES.JSON);

    const content = JSON.stringify(config, null, 2);
    const metadata = {
      name: "book.json",
      parents: [bookFolderId],
      mimeType: MIME_TYPES.JSON,
    };

    if (existingFile) {
      // Update existing file
      await gapi.client.request({
        path: `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}`,
        method: "PATCH",
        params: {
          uploadType: "multipart",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: this.createMultipartBody(metadata, content),
      });
    } else {
      // Create new file
      await gapi.client.request({
        path: "https://www.googleapis.com/upload/drive/v3/files",
        method: "POST",
        params: {
          uploadType: "multipart",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: this.createMultipartBody(metadata, content),
      });
    }
  }

  async getBookConfig(bookName: string): Promise<any | null> {
    const bookFolderId = await this.createBookFolder(bookName);
    const configFile = await this.findFileInFolder(bookFolderId, "book.json", MIME_TYPES.JSON);

    if (!configFile) return null;

    const token = await googleAuth.ensureValidToken();
    const response = await gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${configFile.id}`,
      method: "GET",
      params: {
        alt: "media",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(response.body);
  }

  async saveChapterContent(bookName: string, fileName: string, content: string): Promise<void> {
    const bookFolderId = await this.createBookFolder(bookName);
    const chaptersFolderId = await this.createChaptersFolder(bookFolderId);
    const token = await googleAuth.ensureValidToken();

    // Check if chapter file already exists
    const existingFile = await this.findFileInFolder(
      chaptersFolderId,
      fileName,
      MIME_TYPES.MARKDOWN
    );

    const metadata = {
      name: fileName,
      parents: [chaptersFolderId],
      mimeType: MIME_TYPES.MARKDOWN,
    };

    if (existingFile) {
      // Update existing file
      await gapi.client.request({
        path: `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}`,
        method: "PATCH",
        params: {
          uploadType: "multipart",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: this.createMultipartBody(metadata, content),
      });
    } else {
      // Create new file
      await gapi.client.request({
        path: "https://www.googleapis.com/upload/drive/v3/files",
        method: "POST",
        params: {
          uploadType: "multipart",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: this.createMultipartBody(metadata, content),
      });
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

    const token = await googleAuth.ensureValidToken();
    const response = await gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${chapterFile.id}`,
      method: "GET",
      params: {
        alt: "media",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.body;
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

    const token = await googleAuth.ensureValidToken();
    await gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${chapterFile.id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async listChapterFiles(bookName: string): Promise<string[]> {
    const bookFolderId = await this.createBookFolder(bookName);
    const chaptersFolderId = await this.createChaptersFolder(bookFolderId);
    const token = await googleAuth.ensureValidToken();

    const response = await gapi.client.request({
      path: "https://www.googleapis.com/drive/v3/files",
      method: "GET",
      params: {
        q: `'${chaptersFolderId}' in parents and mimeType='${MIME_TYPES.MARKDOWN}' and trashed=false`,
        fields: "files(name)",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const files = response.result.files || [];
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

    const token = await googleAuth.ensureValidToken();
    await gapi.client.request({
      path: `https://www.googleapis.com/drive/v3/files/${bookFolder.id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

// Create singleton instance
export const googleDriveService = new GoogleDriveService();
