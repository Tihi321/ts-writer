import { Component, For, createSignal } from "solid-js";
import { bookStore } from "@stores/bookStore";
import { bookService } from "@services/bookService";

const BookList: Component = () => {
  const [newBookName, setNewBookName] = createSignal("");

  const handleCreateBook = async () => {
    if (newBookName().trim()) {
      try {
        const bookName = newBookName().trim();
        await bookService.createBook(bookName);
        setNewBookName("");
        await bookStore.refetchBooks(); // Refetch books to update the list
        bookStore.selectBook(bookName); // Select the new book
      } catch (error) {
        console.error("Failed to create book:", error);
        // Optionally, show an error message to the user
      }
    }
  };

  return (
    <div class="flex flex-col items-center justify-center h-full bg-gray-50">
      <div class="p-8 bg-white shadow-lg rounded-lg border border-gray-200 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <div class="text-6xl mb-4">📚</div>
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome to TSWritter</h2>
          <p class="text-gray-600">Select an existing book or create a new one to begin writing</p>
          <p class="text-sm text-gray-500 mt-2">
            Your work is automatically saved locally.
            <button
              onClick={() =>
                import("../../stores/settingsStore").then((m) => m.settingsStore.openSettings())
              }
              class="text-blue-600 hover:text-blue-800 underline"
            >
              Enable cloud sync
            </button>
            to backup to Google Drive.
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select a Book</label>
            <select
              class="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:border-gray-500 focus:outline-none"
              onChange={(e) => bookStore.selectBook(e.currentTarget.value)}
              value={bookStore.selectedBook() || ""}
            >
              <option value="" disabled>
                Choose from your books...
              </option>
              <For each={bookStore.books()}>{(book) => <option value={book}>{book}</option>}</For>
            </select>
          </div>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Create New Book</label>
            <input
              type="text"
              class="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:border-gray-500 focus:outline-none"
              placeholder="Enter book title..."
              value={newBookName()}
              onInput={(e) => setNewBookName(e.currentTarget.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateBook()}
            />
            <button
              class="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg mt-3 transition-colors duration-200 shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleCreateBook}
              disabled={!newBookName().trim()}
            >
              Create Book
            </button>
          </div>
        </div>

        {bookStore.loading() && (
          <div class="mt-6 text-center">
            <p class="text-gray-500">Loading books...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookList;
