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
    <div class="flex flex-col items-center justify-center h-full bg-gray-100">
      <div class="p-8 bg-white shadow-lg rounded-lg">
        <h2 class="text-3xl font-bold mb-6 text-center text-gray-800">Select or Create a Book</h2>
        <div class="w-full max-w-xs mx-auto">
          <select
            class="w-full p-3 border rounded-md mb-4 text-lg"
            onChange={(e) => bookStore.selectBook(e.currentTarget.value)}
            value={bookStore.selectedBook() || ""}
          >
            <option value="" disabled>
              Select a book...
            </option>
            <For each={bookStore.books()}>{(book) => <option value={book}>{book}</option>}</For>
          </select>

          <div class="mt-6">
            <input
              type="text"
              class="w-full p-3 border rounded-md text-lg"
              placeholder="Enter new book name"
              value={newBookName()}
              onInput={(e) => setNewBookName(e.currentTarget.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCreateBook()}
            />
            <button
              class="w-full bg-blue-600 text-white p-3 rounded-md mt-4 text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleCreateBook}
              disabled={!newBookName().trim()}
            >
              Create Book
            </button>
          </div>
        </div>
        {bookStore.loading() && <p class="mt-4 text-center text-gray-500">Loading books...</p>}
      </div>
    </div>
  );
};

export default BookList;
