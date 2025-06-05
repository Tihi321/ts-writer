import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(__dirname, "../../data");
const CHAPTERS_DIR = path.join(DATA_DIR, "chapters");
const BOOK_CONFIG_PATH = path.join(DATA_DIR, "book.json");

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

// Ensure data directory and chapters subdirectory exist
async function initializeDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(CHAPTERS_DIR, { recursive: true });
    console.log("Data directory and chapters subdirectory ensured.");
  } catch (error) {
    console.error("Error initializing data directories:", error);
    throw error; // Re-throw to be handled by caller or crash app if critical
  }
}

// Call initialization early
initializeDataDir().catch((err) => {
  console.error("Failed to initialize data directory on startup:", err);
  process.exit(1); // Exit if essential directories can't be created
});

export async function getBookConfig(): Promise<BookConfig> {
  try {
    await fs.access(BOOK_CONFIG_PATH);
    const fileContent = await fs.readFile(BOOK_CONFIG_PATH, "utf-8");
    return JSON.parse(fileContent) as BookConfig;
  } catch (error) {
    // If file doesn't exist or other error, return default and try to save it
    console.warn(
      `'book.json' not found or unreadable, returning default. Attempting to create/overwrite.`
    );
    await saveBookConfig(DEFAULT_BOOK_CONFIG);
    return DEFAULT_BOOK_CONFIG;
  }
}

export async function saveBookConfig(config: BookConfig): Promise<void> {
  try {
    const data = JSON.stringify(config, null, 2);
    await fs.writeFile(BOOK_CONFIG_PATH, data, "utf-8");
  } catch (error) {
    console.error("Error saving book config:", error);
    throw error;
  }
}

export async function getChapterContent(fileName: string): Promise<string> {
  const filePath = path.join(CHAPTERS_DIR, fileName);
  try {
    await fs.access(filePath);
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading chapter file ${fileName}:`, error);
    // Consider if it should throw or return empty/error marker
    // For now, let's throw, so the caller knows the file is missing/unreadable
    throw new Error(`Chapter file ${fileName} not found or unreadable.`);
  }
}

export async function saveChapterContent(fileName: string, content: string): Promise<void> {
  const filePath = path.join(CHAPTERS_DIR, fileName);
  try {
    await fs.writeFile(filePath, content, "utf-8");
  } catch (error) {
    console.error(`Error writing chapter file ${fileName}:`, error);
    throw error;
  }
}

export async function deleteChapterFile(fileName: string): Promise<void> {
  const filePath = path.join(CHAPTERS_DIR, fileName);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // If the file doesn't exist, unlink will throw ENOENT. We can choose to ignore this.
    // For now, re-throw other errors.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`Error deleting chapter file ${fileName}:`, error);
      throw error;
    }
    console.log(`File ${fileName} did not exist, no action taken for deletion.`);
  }
}

export async function listChapterFiles(): Promise<string[]> {
  try {
    const files = await fs.readdir(CHAPTERS_DIR);
    return files.filter((file) => file.endsWith(".md")); // Assuming chapters are .md files
  } catch (error) {
    console.error("Error listing chapter files:", error);
    return []; // Return empty array on error
  }
}
