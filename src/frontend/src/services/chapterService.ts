import { Chapter, ChapterWithContent } from "../stores/types";

const API_BASE_URL = "/api"; // Using proxy, so no need for http://localhost:3001

export const chapterService = {
  // GET /api/chapters
  async getAllChapters(): Promise<Chapter[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.statusText}`);
      }
      return (await response.json()) as Chapter[];
    } catch (error) {
      console.error("Error fetching all chapters:", error);
      throw error; // Re-throw to be handled by the caller (e.g., the store)
    }
  },

  // GET /api/chapters/:chapterId
  async getChapterById(id: string): Promise<ChapterWithContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chapter ${id}: ${response.statusText}`);
      }
      return (await response.json()) as ChapterWithContent;
    } catch (error) {
      console.error(`Error fetching chapter ${id}:`, error);
      throw error;
    }
  },

  // POST /api/chapters
  async createChapter(title: string): Promise<Chapter> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create chapter: ${response.statusText}`);
      }
      return (await response.json()) as Chapter;
    } catch (error) {
      console.error("Error creating chapter:", error);
      throw error;
    }
  },

  // PUT /api/chapters/:chapterId
  async updateChapter(
    id: string,
    updates: { title?: string; content?: string }
  ): Promise<ChapterWithContent> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`Failed to update chapter ${id}: ${response.statusText}`);
      }
      return (await response.json()) as ChapterWithContent;
    } catch (error) {
      console.error(`Error updating chapter ${id}:`, error);
      throw error;
    }
  },

  // DELETE /api/chapters/:chapterId
  async deleteChapter(id: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete chapter ${id}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error deleting chapter ${id}:`, error);
      throw error;
    }
  },

  // POST /api/chapters/reorder
  async reorderChapters(
    chapterOrder: string[]
  ): Promise<{ message: string; chapterOrder: string[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterOrder }),
      });
      if (!response.ok) {
        throw new Error(`Failed to reorder chapters: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error reordering chapters:", error);
      throw error;
    }
  },
};
