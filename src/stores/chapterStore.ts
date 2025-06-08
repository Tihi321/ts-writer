import { createSignal, createEffect } from "solid-js";
import { Chapter, ChapterWithContent } from "./types";
import { chapterService } from "../services/chapterService";
import { bookStore } from "./bookStore";

const [chapters, setChapters] = createSignal<Chapter[]>([]);
const [selectedChapter, setSelectedChapter] = createSignal<ChapterWithContent | null>(null);
const [loading, setLoading] = createSignal<boolean>(false);
const [error, setError] = createSignal<string | null>(null);

// Load chapters when selected book changes
createEffect(async () => {
  const book = bookStore.selectedBook();
  if (!book) {
    setChapters([]);
    setSelectedChapter(null);
    return;
  }

  try {
    setLoading(true);
    setError(null);
    const bookChapters = await chapterService.getAllChapters(book.id);
    setChapters(bookChapters);
  } catch (err) {
    setError("Failed to load chapters.");
    console.error(err);
  } finally {
    setLoading(false);
  }
});

const selectChapter = async (chapterId: string) => {
  const book = bookStore.selectedBook();
  if (!book) return;

  try {
    setLoading(true);
    setError(null);
    const chapter = await chapterService.getChapterById(book.id, chapterId);
    setSelectedChapter(chapter);
  } catch (err) {
    setError("Failed to load chapter.");
    console.error(err);
  } finally {
    setLoading(false);
  }
};

const createNewChapter = async (title: string) => {
  const book = bookStore.selectedBook();

  if (!book) return;
  try {
    const newChapter = await chapterService.createChapter(book.id, title);
    setChapters([...chapters(), newChapter]);
    return newChapter;
  } catch (err) {
    setError("Failed to create chapter.");
    console.error(err);
  }
};

const updateChapter = async (chapterId: string, updates: { title?: string; content?: string }) => {
  const book = bookStore.selectedBook();
  if (!book) return;

  try {
    setError(null);
    const updatedChapter = await chapterService.updateChapter(book.id, chapterId, updates);

    // Update chapters list if title changed
    if (updates.title) {
      setChapters(
        chapters().map((ch) => (ch.id === chapterId ? { ...ch, title: updates.title! } : ch))
      );
    }

    // Update selected chapter if it's the one being updated
    if (selectedChapter()?.id === chapterId) {
      setSelectedChapter(updatedChapter);
    }

    return updatedChapter;
  } catch (err) {
    setError("Failed to update chapter.");
    console.error(err);
  }
};

const updateChapterTitle = async (chapterId: string, newTitle: string) => {
  return updateChapter(chapterId, { title: newTitle });
};

const deleteChapter = async (chapterId: string) => {
  const book = bookStore.selectedBook();
  if (!book) return;

  try {
    setError(null);
    await chapterService.deleteChapter(book.id, chapterId);

    // Remove from chapters list
    setChapters(chapters().filter((ch) => ch.id !== chapterId));

    // Clear selected chapter if it was the deleted one
    if (selectedChapter()?.id === chapterId) {
      setSelectedChapter(null);
    }
  } catch (err) {
    setError("Failed to delete chapter.");
    console.error(err);
  }
};

const reorderChapters = async (newOrder: string[]) => {
  const book = bookStore.selectedBook();
  if (!book) return;

  try {
    setError(null);
    const result = await chapterService.reorderChapters(book.id, newOrder);
    setChapters(result.chapters);
  } catch (err) {
    setError("Failed to reorder chapters.");
    console.error(err);
  }
};

// Auto-save chapter content
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const autoSaveChapterContent = (chapterId: string, content: string) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    try {
      await updateChapter(chapterId, { content });
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, 1000); // Save after 1 second of inactivity
};

export const chapterStore = {
  chapters,
  selectedChapter,
  loading,
  error,
  selectChapter,
  createNewChapter,
  updateChapter,
  updateChapterTitle,
  deleteChapter,
  reorderChapters,
  autoSaveChapterContent,
  // Add other chapter actions (delete, reorder) as needed
};
