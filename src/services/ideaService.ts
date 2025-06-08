import { Idea } from "../stores/types";
import { dataService } from "./dataService";
import { v4 as uuidv4 } from "uuid";

export const ideaService = {
  // Get all ideas for a chapter (supports both ID and name)
  async getIdeasForChapter(bookIdOrName: string, chapterId: string): Promise<Idea[]> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) return [];

      if (!config.chapters.find((ch) => ch.id === chapterId)) {
        throw new Error(`Chapter ${chapterId} not found`);
      }

      const ideas = config.ideas[chapterId] || [];
      return ideas.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error(`Error fetching ideas for chapter ${chapterId} in ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Create a new idea (supports both ID and name)
  async createIdea(bookIdOrName: string, chapterId: string, text: string): Promise<Idea> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) throw new Error(`Book ${bookIdOrName} not found`);

      if (!config.chapters.find((ch) => ch.id === chapterId)) {
        throw new Error(`Chapter ${chapterId} not found`);
      }

      const chapterIdeas = config.ideas[chapterId] || [];
      const newIdea: Idea = {
        id: uuidv4(),
        text,
        order: chapterIdeas.length,
      };

      config.ideas[chapterId] = [...chapterIdeas, newIdea];
      await dataService.saveBookConfig(bookIdOrName, config);

      return newIdea;
    } catch (error) {
      console.error(`Error creating idea for chapter ${chapterId} in ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Update an idea (supports both ID and name)
  async updateIdea(
    bookIdOrName: string,
    chapterId: string,
    ideaId: string,
    updates: { text?: string; order?: number }
  ): Promise<Idea> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) throw new Error(`Book ${bookIdOrName} not found`);

      if (!config.chapters.find((ch) => ch.id === chapterId)) {
        throw new Error(`Chapter ${chapterId} not found`);
      }

      const chapterIdeas = config.ideas[chapterId] || [];
      const ideaIndex = chapterIdeas.findIndex((i) => i.id === ideaId);
      if (ideaIndex === -1) {
        throw new Error(`Idea ${ideaId} not found`);
      }

      const ideaToUpdate = chapterIdeas[ideaIndex];
      if (updates.text !== undefined) ideaToUpdate.text = updates.text;
      if (updates.order !== undefined) ideaToUpdate.order = updates.order;

      // Re-sort if order was changed
      if (updates.order !== undefined) {
        chapterIdeas.sort((a, b) => a.order - b.order);
      }

      await dataService.saveBookConfig(bookIdOrName, config);
      return ideaToUpdate;
    } catch (error) {
      console.error(`Error updating idea ${ideaId} in ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Delete an idea (supports both ID and name)
  async deleteIdea(
    bookIdOrName: string,
    chapterId: string,
    ideaId: string
  ): Promise<{ message: string }> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) throw new Error(`Book ${bookIdOrName} not found`);

      if (!config.chapters.find((ch) => ch.id === chapterId)) {
        throw new Error(`Chapter ${chapterId} not found`);
      }

      const chapterIdeas = config.ideas[chapterId] || [];
      const initialLength = chapterIdeas.length;
      config.ideas[chapterId] = chapterIdeas.filter((i) => i.id !== ideaId);

      if (config.ideas[chapterId].length === initialLength) {
        throw new Error(`Idea ${ideaId} not found`);
      }

      // Re-normalize the order of remaining ideas
      config.ideas[chapterId].forEach((idea, index) => (idea.order = index));

      await dataService.saveBookConfig(bookIdOrName, config);
      return { message: "Idea deleted successfully" };
    } catch (error) {
      console.error(`Error deleting idea ${ideaId} in ${bookIdOrName}:`, error);
      throw error;
    }
  },

  // Reorder ideas (supports both ID and name)
  async reorderIdeas(
    bookIdOrName: string,
    chapterId: string,
    ideaOrder: string[]
  ): Promise<{ message: string; ideas: Idea[] }> {
    try {
      const config = await dataService.getBookConfig(bookIdOrName);
      if (!config) throw new Error(`Book ${bookIdOrName} not found`);

      const chapterIdeas = config.ideas[chapterId] || [];
      const existingIds = new Set(chapterIdeas.map((i) => i.id));

      if (ideaOrder.length !== existingIds.size || !ideaOrder.every((id) => existingIds.has(id))) {
        throw new Error("Idea order must match existing ideas.");
      }

      const ideaMap = new Map(chapterIdeas.map((i) => [i.id, i]));
      config.ideas[chapterId] = ideaOrder.map((id, index) => {
        const idea = ideaMap.get(id)!;
        return { ...idea, order: index };
      });

      await dataService.saveBookConfig(bookIdOrName, config);
      return {
        message: "Ideas reordered successfully",
        ideas: config.ideas[chapterId],
      };
    } catch (error) {
      console.error(`Error reordering ideas in ${bookIdOrName}:`, error);
      throw error;
    }
  },
};
