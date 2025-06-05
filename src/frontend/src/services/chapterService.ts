import { Chapter, ChapterWithContent } from "../stores/types";

const API_BASE_URL = "/api/books"; // Base URL for books

export const chapterService = {
  // GET /api/books/:bookName/chapters
  async getAllChapters(bookName: string): Promise<Chapter[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookName}/chapters`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chapters for book ${bookName}: ${response.statusText}`);
      }
      return (await response.json()) as Chapter[];
    } catch (error) {
      console.error(`Error fetching chapters for ${bookName}:`, error);
      throw error;
    }
  },

  // GET /api/books/:bookName/chapters/:chapterId
  async getChapterById(bookName: string, id: string): Promise<ChapterWithContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookName}/chapters/${id}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch chapter ${id} for book ${bookName}: ${response.statusText}`
        );
      }
      return (await response.json()) as ChapterWithContent;
    } catch (error) {
      console.error(`Error fetching chapter ${id} for ${bookName}:`, error);
      throw error;
    }
  },

  // POST /api/books/:bookName/chapters
  async createChapter(bookName: string, title: string): Promise<Chapter> {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookName}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create chapter in book ${bookName}: ${response.statusText}`);
      }
      return (await response.json()) as Chapter;
    } catch (error) {
      console.error(`Error creating chapter in ${bookName}:`, error);
      throw error;
    }
  },

  // PUT /api/books/:bookName/chapters/:chapterId
  async updateChapter(
    bookName: string,
    id: string,
    updates: { title?: string; content?: string }
  ): Promise<ChapterWithContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookName}/chapters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to update chapter ${id} in book ${bookName}: ${response.statusText}`
        );
      }
      return (await response.json()) as ChapterWithContent;
    } catch (error) {
      console.error(`Error updating chapter ${id} in ${bookName}:`, error);
      throw error;
    }
  },

  // DELETE /api/books/:bookName/chapters/:chapterId
  async deleteChapter(bookName: string, id: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookName}/chapters/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          `Failed to delete chapter ${id} in book ${bookName}: ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error(`Error deleting chapter ${id} in ${bookName}:`, error);
      throw error;
    }
  },

  // POST /api/books/:bookName/chapters/reorder
  async reorderChapters(
    bookName: string,
    chapterOrder: string[]
  ): Promise<{ message: string; chapterOrder: string[]; chapters: Chapter[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookName}/chapters/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterOrder }),
      });
      if (!response.ok) {
        throw new Error(`Failed to reorder chapters in book ${bookName}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error reordering chapters in ${bookName}:`, error);
      throw error;
    }
  },
};
