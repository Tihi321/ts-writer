import { createSignal, createEffect } from "solid-js";
import { bookManagerService, BookSummary } from "../services/bookManager";

const [books, setBooks] = createSignal<BookSummary[]>([]);
const [selectedBookId, setSelectedBookId] = createSignal<string | null>(null);
const [loading, setLoading] = createSignal<boolean>(true);

// Computed signal for selected book
const selectedBook = () => {
  const bookId = selectedBookId();
  if (!bookId) return null;
  return books().find((book) => book.id === bookId) || null;
};

// Computed signal for book names (for backward compatibility)
const bookNames = () => books().map((book) => book.name);

const loadBooks = async () => {
  try {
    setLoading(true);
    await bookManagerService.initialize();
    const bookList = await bookManagerService.listBooks();
    setBooks(bookList);

    // If no book is selected but books exist, don't auto-select
    // Let the user choose which book to work with
  } catch (error) {
    console.error("Failed to load books:", error);
    // Handle error state in UI if necessary
  } finally {
    setLoading(false);
  }
};

const selectBook = (bookIdOrName: string) => {
  // Support both book ID and book name for backward compatibility
  const book = books().find((b) => b.id === bookIdOrName || b.name === bookIdOrName);
  if (book) {
    setSelectedBookId(book.id);
  } else {
    console.warn(`Book not found: ${bookIdOrName}`);
  }
};

const selectBookById = (bookId: string) => {
  setSelectedBookId(bookId);
};

const selectBookByName = (bookName: string) => {
  const book = books().find((b) => b.name === bookName);
  if (book) {
    setSelectedBookId(book.id);
  } else {
    console.warn(`Book not found: ${bookName}`);
  }
};

const createBook = async (bookName: string): Promise<string> => {
  try {
    const bookId = await bookManagerService.createLocalBook(bookName);
    await loadBooks(); // Refresh the list
    setSelectedBookId(bookId); // Auto-select the new book
    return bookId;
  } catch (error) {
    console.error("Failed to create book:", error);
    throw error;
  }
};

const deleteBook = async (bookId: string, deleteFrom: "local" | "cloud" | "both" = "local") => {
  try {
    await bookManagerService.deleteBook(bookId, deleteFrom);
    await loadBooks(); // Refresh the list

    // If the deleted book was selected, clear selection
    if (selectedBookId() === bookId) {
      setSelectedBookId(null);
    }
  } catch (error) {
    console.error("Failed to delete book:", error);
    throw error;
  }
};

const renameBook = async (bookId: string, newName: string) => {
  try {
    await bookManagerService.renameBook(bookId, newName);
    await loadBooks(); // Refresh the list
  } catch (error) {
    console.error("Failed to rename book:", error);
    throw error;
  }
};

const duplicateBook = async (bookId: string, newName: string): Promise<string> => {
  try {
    const newBookId = await bookManagerService.duplicateBook(bookId, newName);
    await loadBooks(); // Refresh the list
    return newBookId;
  } catch (error) {
    console.error("Failed to duplicate book:", error);
    throw error;
  }
};

const clearSelection = () => {
  setSelectedBookId(null);
};

// Load books on startup
createEffect(() => {
  loadBooks();
});

export const bookStore = {
  // Core state
  books,
  selectedBook,
  selectedBookId,
  loading,

  // Computed values
  bookNames, // For backward compatibility

  // Actions
  refetchBooks: loadBooks,
  selectBook, // Supports both ID and name for backward compatibility
  selectBookById,
  selectBookByName,
  clearSelection,
  createBook,
  deleteBook,
  renameBook,
  duplicateBook,

  // Book management
  getBookStats: () => bookManagerService.getBookStats(),
  listLocalBooks: () => bookManagerService.listLocalBooks(),
  listCloudBooks: () => bookManagerService.listCloudBooks(),
  listOutOfSyncBooks: () => bookManagerService.listOutOfSyncBooks(),
};
