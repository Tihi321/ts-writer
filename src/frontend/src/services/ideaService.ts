import { Idea } from "../stores/types";

const API_BASE_URL = "/api/books";

export const ideaService = {
  // GET /api/books/:bookName/chapters/:chapterId/ideas
  async getIdeasForChapter(bookName: string, chapterId: string): Promise<Idea[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookName}/chapters/${chapterId}/ideas`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ideas for chapter ${chapterId} in book ${bookName}: ${response.statusText}`
        );
      }
      return (await response.json()) as Idea[];
    } catch (error) {
      console.error(`Error fetching ideas for chapter ${chapterId} in ${bookName}:`, error);
      throw error;
    }
  },

  // POST /api/books/:bookName/chapters/:chapterId/ideas
  async createIdea(bookName: string, chapterId: string, text: string): Promise<Idea> {
    try {
      const response = await fetch(`${API_BASE_URL}/${bookName}/chapters/${chapterId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error(
          `Failed to create idea for chapter ${chapterId} in book ${bookName}: ${response.statusText}`
        );
      }
      return (await response.json()) as Idea;
    } catch (error) {
      console.error(`Error creating idea for chapter ${chapterId} in ${bookName}:`, error);
      throw error;
    }
  },

  // PUT /api/books/:bookName/chapters/:chapterId/ideas/:ideaId
  async updateIdea(
    bookName: string,
    chapterId: string,
    ideaId: string,
    updates: { text?: string; order?: number }
  ): Promise<Idea> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${bookName}/chapters/${chapterId}/ideas/${ideaId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (!response.ok) {
        throw new Error(
          `Failed to update idea ${ideaId} in book ${bookName}: ${response.statusText}`
        );
      }
      return (await response.json()) as Idea;
    } catch (error) {
      console.error(`Error updating idea ${ideaId} in ${bookName}:`, error);
      throw error;
    }
  },

  // DELETE /api/books/:bookName/chapters/:chapterId/ideas/:ideaId
  async deleteIdea(
    bookName: string,
    chapterId: string,
    ideaId: string
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${bookName}/chapters/${chapterId}/ideas/${ideaId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(
          `Failed to delete idea ${ideaId} in book ${bookName}: ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error(`Error deleting idea ${ideaId} in ${bookName}:`, error);
      throw error;
    }
  },

  // POST /api/books/:bookName/chapters/:chapterId/ideas/reorder
  async reorderIdeas(
    bookName: string,
    chapterId: string,
    ideaOrder: string[]
  ): Promise<{ message: string; ideas: Idea[] }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/${bookName}/chapters/${chapterId}/ideas/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ideaOrder }),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to reorder ideas in book ${bookName}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error reordering ideas in ${bookName}:`, error);
      throw error;
    }
  },
};
