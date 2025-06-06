import { createSignal, createEffect } from "solid-js";
import { Idea } from "./types";
import { ideaService } from "../services/ideaService";
import { bookStore } from "./bookStore";
import { chapterStore } from "./chapterStore";

const [ideas, setIdeas] = createSignal<Idea[]>([]);
const [loading, setLoading] = createSignal<boolean>(false);
const [error, setError] = createSignal<string | null>(null);

// Effect to load ideas when the selected chapter changes
createEffect(async () => {
  const book = bookStore.selectedBook();
  const chapter = chapterStore.selectedChapter();

  if (book && chapter) {
    setLoading(true);
    try {
      const ideaList = await ideaService.getIdeasForChapter(book, chapter.id);
      setIdeas(ideaList);
    } catch (err) {
      setError("Failed to load ideas.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  } else {
    setIdeas([]); // Clear ideas if no chapter is selected
  }
});

// Function to create a new idea
const createNewIdea = async (text: string) => {
  const book = bookStore.selectedBook();
  const chapter = chapterStore.selectedChapter();
  if (!book || !chapter) return;

  try {
    const newIdea = await ideaService.createIdea(book, chapter.id, text);
    setIdeas([...ideas(), newIdea]);
    return newIdea;
  } catch (err) {
    setError("Failed to create idea.");
    console.error(err);
  }
};

const updateIdea = async (ideaId: string, text: string) => {
  const book = bookStore.selectedBook();
  const chapter = chapterStore.selectedChapter();
  if (!book || !chapter) return;

  try {
    const updatedIdea = await ideaService.updateIdea(book, chapter.id, ideaId, { text });

    // Update the idea in the list
    const currentIdeas = ideas();
    const index = currentIdeas.findIndex((i) => i.id === ideaId);
    if (index !== -1) {
      const newIdeas = [...currentIdeas];
      newIdeas[index] = updatedIdea;
      setIdeas(newIdeas);
    }

    return updatedIdea;
  } catch (err) {
    setError("Failed to update idea.");
    console.error(err);
  }
};

const deleteIdea = async (ideaId: string) => {
  const book = bookStore.selectedBook();
  const chapter = chapterStore.selectedChapter();
  if (!book || !chapter) return;

  try {
    await ideaService.deleteIdea(book, chapter.id, ideaId);

    // Remove idea from the list
    const currentIdeas = ideas();
    const newIdeas = currentIdeas.filter((i) => i.id !== ideaId);
    setIdeas(newIdeas);
  } catch (err) {
    setError("Failed to delete idea.");
    console.error(err);
  }
};

const reorderIdeas = async (newOrder: string[]) => {
  const book = bookStore.selectedBook();
  const chapter = chapterStore.selectedChapter();
  if (!book || !chapter) return;

  try {
    const result = await ideaService.reorderIdeas(book, chapter.id, newOrder);
    setIdeas(result.ideas);
  } catch (err) {
    setError("Failed to reorder ideas.");
    console.error(err);
  }
};

export const ideaStore = {
  ideas,
  loading,
  error,
  createNewIdea,
  updateIdea,
  deleteIdea,
  reorderIdeas,
  // Add other idea actions (update, delete, reorder) as needed
};
