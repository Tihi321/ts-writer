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
      <div class="flex flex-col h-screen">
        <header class="bg-gray-800 text-white p-3 shadow-md z-10 flex justify-between items-center">
          <h1 class="text-xl font-semibold">TSWritter</h1>
          <Show when={bookStore.selectedBook()}>
            <button
              onClick={handleBackToBooks}
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to Books
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
