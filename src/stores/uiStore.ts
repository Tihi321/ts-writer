import { createSignal } from "solid-js";

interface UIState {
  isZenMode: boolean;
  showChapters: boolean;
  showIdeas: boolean;
  autoSaveEnabled: boolean;
}

const [uiState, setUIState] = createSignal<UIState>({
  isZenMode: false,
  showChapters: true,
  showIdeas: true,
  autoSaveEnabled: true,
});

export const uiStore = {
  // Getters
  state: uiState,
  isZenMode: () => uiState().isZenMode,
  showChapters: () => uiState().showChapters,
  showIdeas: () => uiState().showIdeas,
  autoSaveEnabled: () => uiState().autoSaveEnabled,

  // Actions
  toggleZenMode: () => {
    const currentState = uiState();
    const newZenMode = !currentState.isZenMode;

    setUIState({
      ...currentState,
      isZenMode: newZenMode,
      showChapters: !newZenMode,
      showIdeas: !newZenMode,
    });
  },

  toggleChapters: () => {
    setUIState((prev) => ({
      ...prev,
      showChapters: !prev.showChapters,
      isZenMode: false, // Exit zen mode when manually toggling
    }));
  },

  toggleIdeas: () => {
    setUIState((prev) => ({
      ...prev,
      showIdeas: !prev.showIdeas,
      isZenMode: false, // Exit zen mode when manually toggling
    }));
  },

  toggleAutoSave: () => {
    setUIState((prev) => ({
      ...prev,
      autoSaveEnabled: !prev.autoSaveEnabled,
    }));
  },

  // Reset to default state
  resetToDefault: () => {
    setUIState({
      isZenMode: false,
      showChapters: true,
      showIdeas: true,
      autoSaveEnabled: true,
    });
  },
};
