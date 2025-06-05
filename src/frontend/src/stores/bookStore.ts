import { createSignal, createEffect } from "solid-js";
import { bookService } from "../services/bookService";

const [books, setBooks] = createSignal<string[]>([]);
const [selectedBook, setSelectedBook] = createSignal<string | null>(null);
const [loading, setLoading] = createSignal<boolean>(true);

const loadBooks = async () => {
  try {
    setLoading(true);
    const bookList = await bookService.getAllBooks();
    setBooks(bookList);
    if (bookList.length > 0) {
      // Automatically select the first book or use a saved preference
      setSelectedBook(bookList[0]);
    }
  } catch (error) {
    console.error("Failed to load books:", error);
    // Handle error state in UI if necessary
  } finally {
    setLoading(false);
  }
};

// Load books on startup
createEffect(() => {
  loadBooks();
});

export const bookStore = {
  books,
  selectedBook,
  loading,
  refetchBooks: loadBooks,
  selectBook: setSelectedBook,
};
