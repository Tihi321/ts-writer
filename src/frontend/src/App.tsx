import type { Component } from "solid-js";
import { Show } from "solid-js";
import { DragDropProvider } from "@thisbeyond/solid-dnd";

// Using path aliases defined in tsconfig.json
import MainLayout from "@components/Layout/MainLayout";
import ChapterList from "@components/Chapters/ChapterList";
import EditorArea from "@components/Editor/EditorArea";
import IdeasSidebar from "@components/Ideas/IdeasSidebar";
import BookList from "@components/Book/BookList";
import { bookStore } from "@stores/bookStore";

const App: Component = () => {
  const handleBackToBooks = () => {
    bookStore.selectBook(null);
  };

  return (
    <DragDropProvider>
      <div class="flex flex-col h-screen bg-gray-50">
        <header class="bg-white text-gray-900 p-4 shadow-sm z-10 flex justify-between items-center border-b border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="text-2xl">📝</div>
            <h1 class="text-2xl font-semibold tracking-tight">TSWritter</h1>
            <div class="text-sm text-gray-500 font-medium hidden sm:block">
              A Writer's Companion
            </div>
          </div>
          <Show when={bookStore.selectedBook()}>
            <button
              onClick={handleBackToBooks}
              class="bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 shadow-sm"
            >
              ← Back to Books
            </button>
          </Show>
        </header>

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
    </DragDropProvider>
  );
};

export default App;
