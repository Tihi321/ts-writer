// src/utils/fileSystem.ts

import { indexedDBService, BookEntry, BookConfig, Chapter } from "../services/indexedDB";

// Export a local book to a user-selected folder using the File System Access API
export async function exportBookToFolder(bookId: string) {
  if (!("showDirectoryPicker" in window)) {
    throw new Error("File System Access API is not supported in this browser.");
  }

  await indexedDBService.initialize();
  const book: BookEntry | null = await indexedDBService.getBook(bookId);
  if (!book) throw new Error("Book not found");

  // Prepare info.json (cloud export uses BookInfo structure)
  const info = {
    id: book.id,
    name: book.name,
    version: book.version,
    createdAt: book.localLastModified, // No explicit createdAt, use localLastModified
    lastModified: book.localLastModified,
    config: book.config,
  };

  // Get all chapter files
  const chapterFiles = await indexedDBService.listChapterFiles(bookId);

  // Prompt user to select a parent folder
  // @ts-ignore
  const parentDirHandle = await window.showDirectoryPicker();

  // Create a subfolder named after the book's id
  let bookDirHandle;
  try {
    bookDirHandle = await parentDirHandle.getDirectoryHandle(book.id, { create: true });
  } catch (e) {
    throw new Error("Failed to create/find book folder: " + (e instanceof Error ? e.message : e));
  }

  // Write info.json in the book folder
  const infoFile = await bookDirHandle.getFileHandle("info.json", { create: true });
  const infoWritable = await infoFile.createWritable();
  await infoWritable.write(JSON.stringify(info, null, 2));
  await infoWritable.close();

  // Create chapters subfolder if it doesn't exist
  let chaptersDirHandle;
  try {
    chaptersDirHandle = await bookDirHandle.getDirectoryHandle("chapters", { create: true });
  } catch (e) {
    throw new Error(
      "Failed to create/find chapters folder: " + (e instanceof Error ? e.message : e)
    );
  }

  // Write each chapter as a .md file in chapters folder
  for (const fileName of chapterFiles) {
    const content = await indexedDBService.getChapterContent(bookId, fileName);
    if (content !== null) {
      const chapterFile = await chaptersDirHandle.getFileHandle(fileName, { create: true });
      const chapterWritable = await chapterFile.createWritable();
      await chapterWritable.write(content);
      await chapterWritable.close();
    }
  }
}

// Import a book from a user-selected folder using the File System Access API
export async function importBookFromFolder() {
  if (!("showDirectoryPicker" in window)) {
    throw new Error("File System Access API is not supported in this browser.");
  }

  await indexedDBService.initialize();
  // @ts-ignore
  const dirHandle = await window.showDirectoryPicker();

  // Read info.json
  let info: any;
  try {
    const infoFile = await dirHandle.getFileHandle("info.json");
    const infoFileData = await infoFile.getFile();
    const infoText = await infoFileData.text();
    info = JSON.parse(infoText);
  } catch (e) {
    throw new Error("Failed to read info.json: " + (e instanceof Error ? e.message : e));
  }

  // Check for name conflict
  const allBooks = await indexedDBService.listBooks();
  let name = info.name;
  if (allBooks.some((b) => b.name === name)) {
    name = name + " (Cloud)";
  }

  // Create new book id
  const bookId = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Prepare BookEntry
  const book: BookEntry = {
    id: bookId,
    name,
    source: "cloud",
    syncStatus: "local_only",
    config: info.config,
    localLastModified: Date.now(),
    version: info.version || "1.0.0",
  };
  await indexedDBService.saveBook(book);

  // Read chapters from chapters subfolder
  let chaptersDirHandle;
  try {
    chaptersDirHandle = await dirHandle.getDirectoryHandle("chapters");
  } catch (e) {
    throw new Error("No chapters folder found in selected book folder.");
  }

  for await (const entry of chaptersDirHandle.values()) {
    if (entry.kind === "file" && entry.name.endsWith(".md")) {
      const file = await entry.getFile();
      const content = await file.text();
      await indexedDBService.saveChapterContent(bookId, entry.name, content, false);
    }
  }
}
