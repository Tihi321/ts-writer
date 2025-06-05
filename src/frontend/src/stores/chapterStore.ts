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

export const chapterStore = {
  chapters,
  selectedChapter,
  loading,
  error,
  selectChapter,
  createNewChapter,
  // Add other chapter actions (update, delete, reorder) as needed
};
