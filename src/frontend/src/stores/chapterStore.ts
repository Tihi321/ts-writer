import { createStore } from "solid-js/store";
import { Chapter } from "./types"; // We'll create this type definition file next

export interface ChapterState {
  chapters: Chapter[];
  selectedChapterId: string | null;
  selectedChapterContent: string | null;
  isLoading: boolean;
  error: string | null;
}

const [chapterStore, setChapterStore] = createStore<ChapterState>({
  chapters: [],
  selectedChapterId: null,
  selectedChapterContent: null,
  isLoading: false,
  error: null,
});

export { chapterStore, setChapterStore };
