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

export const ideaStore = {
  ideas,
  loading,
  error,
  createNewIdea,
  // Add other idea actions (update, delete, reorder) as needed
};
