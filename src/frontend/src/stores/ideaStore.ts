import { createStore } from "solid-js/store";
import { Idea } from "./types";

export interface IdeaState {
  ideas: Idea[];
  isLoading: boolean;
  error: string | null;
}

const [ideaStore, setIdeaStore] = createStore<IdeaState>({
  ideas: [],
  isLoading: false,
  error: null,
});

export { ideaStore, setIdeaStore };
