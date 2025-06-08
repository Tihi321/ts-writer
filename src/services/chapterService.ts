import { Chapter, ChapterWithContent } from "../stores/types";
import { dataService } from "./dataService";
import { bookManagerService } from "./bookManager";
import { v4 as uuidv4 } from "uuid";
import { indexedDBService } from "./indexedDB";

export const chapterService = {
  // Get all chapters for a book (supports both ID and name)
  async getAllChapters(bookIdOrName: string): Promise<Chapter[]> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) return [];

      // Return chapters in the correct order
      const sortedChapters = config.chapterOrder
        .map((id) => config.chapters.find((ch) => ch.id === id))
        .filter(Boolean) as Chapter[];

      return sortedChapters;
    } catch (error) {
      console.error(`Error fetching chapters for ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Get a specific chapter with content (supports both ID and name)
  async getChapterById(bookIdOrName: string, id: string): Promise<ChapterWithContent> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) throw new Error(`Book ${bookIdOrName} not found`);

      const chapter = config.chapters.find((ch) => ch.id === id);
      if (!chapter) throw new Error(`Chapter ${id} not found`);

      const content = await dataService.getChapterContent(bookIdOrName, chapter.fileName);

      return {
        ...chapter,
        content: content || "",
      };
    } catch (error) {
      console.error(`Error fetching chapter ${id} for ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Create a new chapter (supports both ID and name)
  async createChapter(bookIdOrName: string, title: string): Promise<Chapter> {
    try {
      // Get book by ID first, then by name for backward compatibility
      let book = await bookManagerService.getBook(bookIdOrName);

      if (!book) {
        book = await bookManagerService.getBookByName(bookIdOrName);
      }

      if (!book) {
        throw new Error(`Book ${bookIdOrName} not found`);
      }

      const config = await dataService.getBookConfig(book.id);
      if (!config) throw new Error(`Book config not found for ${book.name} (ID: ${book.id})`);

      const newChapterId = uuidv4();
      const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}-${newChapterId.slice(0, 8)}.md`;

      const newChapter: Chapter = {
        id: newChapterId,
        title,
        fileName,
      };

      // Save initial chapter content using book ID
      await dataService.saveChapterContent(book.id, fileName, `# ${title}\n\nStart writing...`);

      // Update book config
      config.chapters.push(newChapter);
      config.chapterOrder.push(newChapterId);
      config.ideas[newChapterId] = [];

      await dataService.saveBookConfig(book.id, config);

      return newChapter;
    } catch (error) {
      console.error(`Error creating chapter in ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Update a chapter (supports both ID and name)
  async updateChapter(
    bookIdOrName: string,
    id: string,
    updates: { title?: string; content?: string }
  ): Promise<ChapterWithContent> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) throw new Error(`Book ${bookIdOrName} not found`);

      const chapterIndex = config.chapters.findIndex((ch) => ch.id === id);
      if (chapterIndex === -1) throw new Error(`Chapter ${id} not found`);

      const chapter = config.chapters[chapterIndex];
      let configChanged = false;

      // Update title if provided
      if (updates.title && updates.title !== chapter.title) {
        chapter.title = updates.title;
        configChanged = true;
      }

      // Update content if provided
      if (typeof updates.content === "string") {
        await dataService.saveChapterContent(bookIdOrName, chapter.fileName, updates.content);
      }

      // Save config if title changed
      if (configChanged) {
        await dataService.saveBookConfig(bookIdOrName, config);
      }

      // Get updated content
      const content = await dataService.getChapterContent(bookIdOrName, chapter.fileName);

      return {
        ...chapter,
        content: content || "",
      };
    } catch (error) {
      console.error(`Error updating chapter ${id} in ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Delete a chapter (supports both ID and name)
  async deleteChapter(bookIdOrName: string, id: string): Promise<{ message: string }> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) throw new Error(`Book ${bookIdOrName} not found`);

      const chapterIndex = config.chapters.findIndex((ch) => ch.id === id);
      if (chapterIndex === -1) throw new Error(`Chapter ${id} not found`);

      const chapter = config.chapters[chapterIndex];

      // Delete chapter file
      await dataService.deleteChapterContent(bookIdOrName, chapter.fileName);

      // Remove from config
      config.chapters.splice(chapterIndex, 1);
      config.chapterOrder = config.chapterOrder.filter((chId) => chId !== id);
      delete config.ideas[id];

      await dataService.saveBookConfig(bookIdOrName, config);

      return { message: "Chapter deleted successfully" };
    } catch (error) {
      console.error(`Error deleting chapter ${id} in ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Reorder chapters (supports both ID and name)
  async reorderChapters(
    bookIdOrName: string,
    chapterOrder: string[]
  ): Promise<{ message: string; chapterOrder: string[]; chapters: Chapter[] }> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) throw new Error(`Book ${bookIdOrName} not found`);

      const existingIds = new Set(config.chapters.map((c) => c.id));

      if (
        chapterOrder.length !== existingIds.size ||
        !chapterOrder.every((id) => existingIds.has(id))
      ) {
        throw new Error("Chapter order must contain all and only existing chapter IDs.");
      }

      config.chapterOrder = chapterOrder;
      await dataService.saveBookConfig(bookIdOrName, config);

      // Return the reordered chapters
      const sortedChapters = config.chapterOrder
        .map((id) => config.chapters.find((ch) => ch.id === id))
        .filter(Boolean) as Chapter[];

      return {
        message: "Chapter order updated successfully",
        chapterOrder,
        chapters: sortedChapters,
      };
    } catch (error) {
      console.error(`Error reordering chapters in ${bookIdOrName}:`, error);
      throw error;
    }
  },
};
