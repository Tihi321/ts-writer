import type { Component } from "solid-js";
import { Show, onMount } from "solid-js";
import { DragDropProvider } from "@thisbeyond/solid-dnd";

// Using path aliases defined in tsconfig.json
import MainLayout from "@components/Layout/MainLayout";
import ChapterList from "@components/Chapters/ChapterList";
import EditorArea from "@components/Editor/EditorArea";
import IdeasSidebar from "@components/Ideas/IdeasSidebar";
import BookList from "@components/Book/BookList";
import TopToolbar from "@components/Layout/TopToolbar";
import SettingsModal from "@components/SettingsModal";
import { bookStore } from "@stores/bookStore";
import { uiStore } from "@stores/uiStore";
import { settingsStore } from "@stores/settingsStore";
import { dataService } from "@services/dataService";

const App: Component = () => {
  // Initialize services on app startup
  onMount(async () => {
    try {
      // Initialize settings first
      settingsStore.initialize();

      // Initialize data service (which will restore auth state if available)
      await dataService.initialize();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  });

  return (
    <DragDropProvider>
      <div class="flex flex-col h-screen bg-white">
        {/* Settings Modal */}
        <SettingsModal />

        {/* Top Toolbar - Always visible */}
        <TopToolbar />

        {/* Add padding-top to account for fixed toolbar */}
        <div class="pt-12 flex flex-col flex-grow">
          <div class="flex-grow overflow-hidden">
            <Show when={bookStore.selectedBook()} fallback={<BookList />}>
              <MainLayout
                chaptersPanel={<ChapterList />}
                editorPanel={<EditorArea />}
                ideasPanel={<IdeasSidebar />}
              />
            </Show>
          </div>
        </div>
      </div>
    </DragDropProvider>
  );
};

export default App;
