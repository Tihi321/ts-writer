import { Idea } from "../stores/types";

const API_BASE_URL = "/api";

export const ideaService = {
  // GET /api/chapters/:chapterId/ideas
  async getIdeasForChapter(chapterId: string): Promise<Idea[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/ideas`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ideas for chapter ${chapterId}: ${response.statusText}`);
      }
      return (await response.json()) as Idea[];
    } catch (error) {
      console.error(`Error fetching ideas for chapter ${chapterId}:`, error);
      throw error;
    }
  },

  // POST /api/chapters/:chapterId/ideas
  async createIdea(chapterId: string, text: string): Promise<Idea> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create idea for chapter ${chapterId}: ${response.statusText}`);
      }
      return (await response.json()) as Idea;
    } catch (error) {
      console.error(`Error creating idea for chapter ${chapterId}:`, error);
      throw error;
    }
  },

  // PUT /api/chapters/:chapterId/ideas/:ideaId
  async updateIdea(
    chapterId: string,
    ideaId: string,
    updates: { text?: string; order?: number }
  ): Promise<Idea> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/ideas/${ideaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`Failed to update idea ${ideaId}: ${response.statusText}`);
      }
      return (await response.json()) as Idea;
    } catch (error) {
      console.error(`Error updating idea ${ideaId}:`, error);
      throw error;
    }
  },

  // DELETE /api/chapters/:chapterId/ideas/:ideaId
  async deleteIdea(chapterId: string, ideaId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/ideas/${ideaId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete idea ${ideaId}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error deleting idea ${ideaId}:`, error);
      throw error;
    }
  },

  // POST /api/chapters/:chapterId/ideas/reorder
  async reorderIdeas(
    chapterId: string,
    ideaOrder: string[]
  ): Promise<{ message: string; ideas: Idea[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/chapters/${chapterId}/ideas/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaOrder }),
      });
      if (!response.ok) {
        throw new Error(`Failed to reorder ideas: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error reordering ideas:", error);
      throw error;
    }
  },
};
