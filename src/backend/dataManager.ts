import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(__dirname, "../../data");

function getBookDir(bookName: string): string {
  return path.join(DATA_DIR, bookName);
}

function getChaptersDir(bookName: string): string {
  return path.join(getBookDir(bookName), "chapters");
}

function getBookConfigPath(bookName: string): string {
  return path.join(getBookDir(bookName), "book.json");
}

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
  chapterOrder: string[]; // Array of chapter IDs
  ideas: Record<string, Idea[]>; // Key is chapter ID
}

const DEFAULT_BOOK_CONFIG: BookConfig = {
  chapters: [],
  chapterOrder: [],
  ideas: {},
};

// Ensure data directory and chapters subdirectory exist for a given book
async function initializeBookDir(bookName: string): Promise<void> {
  try {
    const bookDir = getBookDir(bookName);
    const chaptersDir = getChaptersDir(bookName);
    await fs.mkdir(bookDir, { recursive: true });
    await fs.mkdir(chaptersDir, { recursive: true });
    console.log(`Data directory and chapters subdirectory ensured for book: ${bookName}`);
  } catch (error) {
    console.error(`Error initializing data directories for book ${bookName}:`, error);
    throw error; // Re-throw to be handled by caller
  }
}

// This function is no longer called on startup, but on-demand when a book is created/accessed.
// initializeDataDir().catch((err) => {
//   console.error("Failed to initialize data directory on startup:", err);
//   process.exit(1); // Exit if essential directories can't be created
// });

export async function listBooks(): Promise<string[]> {
  try {
    await fs.access(DATA_DIR);
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    const directories = entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    return directories;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.mkdir(DATA_DIR, { recursive: true });
      return []; // data directory didn't exist, it's created now, no books yet.
    }
    console.error("Error listing books:", error);
    throw error;
  }
}

export async function getBookConfig(bookName: string): Promise<BookConfig> {
  const bookConfigPath = getBookConfigPath(bookName);
  try {
    await fs.access(bookConfigPath);
    const fileContent = await fs.readFile(bookConfigPath, "utf-8");
    return JSON.parse(fileContent) as BookConfig;
  } catch (error) {
    console.warn(`'book.json' for book '${bookName}' not found or unreadable, returning default.`);
    // Before returning default, ensure the directory structure exists
    await initializeBookDir(bookName);
    await saveBookConfig(bookName, DEFAULT_BOOK_CONFIG);
    return DEFAULT_BOOK_CONFIG;
  }
}

export async function saveBookConfig(bookName: string, config: BookConfig): Promise<void> {
  const bookConfigPath = getBookConfigPath(bookName);
  try {
    // Ensure the directory exists before writing the file
    await fs.mkdir(path.dirname(bookConfigPath), { recursive: true });
    const data = JSON.stringify(config, null, 2);
    await fs.writeFile(bookConfigPath, data, "utf-8");
  } catch (error) {
    console.error(`Error saving book config for ${bookName}:`, error);
    throw error;
  }
}

export async function getChapterContent(bookName: string, fileName: string): Promise<string> {
  const chaptersDir = getChaptersDir(bookName);
  const filePath = path.join(chaptersDir, fileName);
  try {
    await fs.access(filePath);
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading chapter file ${fileName} for book ${bookName}:`, error);
    throw new Error(`Chapter file ${fileName} for book ${bookName} not found or unreadable.`);
  }
}

export async function saveChapterContent(
  bookName: string,
  fileName: string,
  content: string
): Promise<void> {
  const chaptersDir = getChaptersDir(bookName);
  const filePath = path.join(chaptersDir, fileName);
  try {
    // Ensure the chapters directory exists before writing the file
    await fs.mkdir(chaptersDir, { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
  } catch (error) {
    console.error(`Error writing chapter file ${fileName} for book ${bookName}:`, error);
    throw error;
  }
}

export async function deleteChapterFile(bookName: string, fileName: string): Promise<void> {
  const chaptersDir = getChaptersDir(bookName);
  const filePath = path.join(chaptersDir, fileName);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`Error deleting chapter file ${fileName} for book ${bookName}:`, error);
      throw error;
    }
    console.log(`File ${fileName} for book ${bookName} did not exist, no action taken.`);
  }
}

export async function listChapterFiles(bookName: string): Promise<string[]> {
  const chaptersDir = getChaptersDir(bookName);
  try {
    await fs.access(chaptersDir);
    const files = await fs.readdir(chaptersDir);
    return files.filter((file) => file.endsWith(".md"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return []; // If chapters directory doesn't exist, return empty array.
    }
    console.error(`Error listing chapter files for book ${bookName}:`, error);
    return [];
  }
}

export async function createBook(bookName: string): Promise<void> {
  try {
    await initializeBookDir(bookName);
    // The book is created implicitly by creating its directory and config.
    // getBookConfig will create a default config if one doesn't exist.
    await getBookConfig(bookName);
  } catch (error) {
    console.error(`Error creating book '${bookName}':`, error);
    throw error;
  }
}
