import { createSignal, createEffect } from "solid-js";
import { Chapter, ChapterWithContent } from "./types";
import { chapterService } from "../services/chapterService";
import { bookStore } from "./bookStore";

const [chapters, setChapters] = createSignal<Chapter[]>([]);
const [selectedChapter, setSelectedChapter] = createSignal<ChapterWithContent | null>(null);
const [loading, setLoading] = createSignal<boolean>(false);
const [error, setError] = createSignal<string | null>(null);

// Effect to load chapters when the selected book changes
createEffect(async () => {
  const book = bookStore.selectedBook();
  if (book) {
    setLoading(true);
    try {
      const chapterList = await chapterService.getAllChapters(book);
      setChapters(chapterList);
      setSelectedChapter(null); // Reset selected chapter when book changes
    } catch (err) {
      setError("Failed to load chapters.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  } else {
    setChapters([]); // Clear chapters if no book is selected
  }
});

// Function to select a chapter and load its content
const selectChapter = async (chapterId: string) => {
  const book = bookStore.selectedBook();
  if (!book) return;

  setLoading(true);
  try {
    const chapterContent = await chapterService.getChapterById(book, chapterId);
    setSelectedChapter(chapterContent);
  } catch (err) {
    setError("Failed to load chapter content.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const createNewChapter = async (title: string) => {
  const book = bookStore.selectedBook();
  if (!book) return;
  try {
    const newChapter = await chapterService.createChapter(book, title);
    setChapters([...chapters(), newChapter]);
    return newChapter;
  } catch (err) {
    setError("Failed to create chapter.");
    console.error(err);
  }
};

const updateChapter = async (id: string, content: string) => {
  const book = bookStore.selectedBook();
  if (!book) return;

  try {
    const updatedChapter = await chapterService.updateChapter(book, id, { content });
    setSelectedChapter(updatedChapter);

    // Also update the chapter in the main list if needed (for previews, etc.)
    const currentChapters = chapters();
    const index = currentChapters.findIndex((c) => c.id === id);
    if (index !== -1) {
      // Note: The list contains `Chapter`, but `updateChapter` returns `ChapterWithContent`.
      // We only need to update fields present in `Chapter`.
      const newChapters = [...currentChapters];
      newChapters[index] = { ...newChapters[index], ...updatedChapter }; // this might need adjustment based on returned object
      setChapters(newChapters);
    }
    return updatedChapter;
  } catch (err) {
    setError("Failed to update chapter.");
    console.error(err);
  }
};

const reorderChapters = async (newOrder: string[]) => {
  const book = bookStore.selectedBook();
  if (!book) return;

  try {
    const result = await chapterService.reorderChapters(book, newOrder);
    // Update local state with the reordered chapters from the server
    setChapters(result.chapters);
  } catch (err) {
    setError("Failed to reorder chapters.");
    console.error(err);
  }
};

export const chapterStore = {
  chapters,
  selectedChapter,
  loading,
  error,
  selectChapter,
  createNewChapter,
  updateChapter,
  reorderChapters,
  // Add other chapter actions (delete, reorder) as needed
};
