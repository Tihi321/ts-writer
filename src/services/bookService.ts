import { bookManagerService } from "./bookManager";

export const bookService = {
  // List all books (backward compatibility - returns book names)
  async getAllBooks(): Promise<string[]> {
    try {
      const books = await bookManagerService.listBooks();
      return books.map((book) => book.name);
    } catch (error) {
      console.error("Error fetching all books:", error);
      throw error;
    }
  },

  // Create a new book (backward compatibility - returns void)
  async createBook(bookName: string): Promise<void> {
    try {
      await bookManagerService.createLocalBook(bookName);
    } catch (error) {
      console.error("Error creating book:", error);
      throw error;
    }
  },

  // Delete a book (backward compatibility - uses book name)
  async deleteBook(bookName: string): Promise<void> {
    try {
      // Find book by name and delete it
      const book = await bookManagerService.getBookByName(bookName);
      if (book) {
        await bookManagerService.deleteBook(book.id, "local");
      } else {
        throw new Error(`Book "${bookName}" not found`);
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      throw error;
    }
  },

  // Enhanced methods that work with the new system

  // Get book by name (returns full book info)
  async getBookByName(bookName: string) {
    try {
      return await bookManagerService.getBookByName(bookName);
    } catch (error) {
      console.error("Error fetching book by name:", error);
      throw error;
    }
  },

  // Get book by ID
  async getBookById(bookId: string) {
    try {
      return await bookManagerService.getBook(bookId);
    } catch (error) {
      console.error("Error fetching book by ID:", error);
      throw error;
    }
  },

  // Create book and return ID
  async createBookWithId(bookName: string): Promise<string> {
    try {
      return await bookManagerService.createLocalBook(bookName);
    } catch (error) {
      console.error("Error creating book:", error);
      throw error;
    }
  },

  // Delete book by ID
  async deleteBookById(
    bookId: string,
    deleteFrom: "local" | "cloud" | "both" = "local"
  ): Promise<void> {
    try {
      await bookManagerService.deleteBook(bookId, deleteFrom);
    } catch (error) {
      console.error("Error deleting book:", error);
      throw error;
    }
  },

  // Rename book
  async renameBook(bookId: string, newName: string): Promise<void> {
    try {
      await bookManagerService.renameBook(bookId, newName);
    } catch (error) {
      console.error("Error renaming book:", error);
      throw error;
    }
  },

  // Duplicate book
  async duplicateBook(bookId: string, newName: string): Promise<string> {
    try {
      return await bookManagerService.duplicateBook(bookId, newName);
    } catch (error) {
      console.error("Error duplicating book:", error);
      throw error;
    }
  },

  // List books with full info
  async getAllBooksWithInfo() {
    try {
      return await bookManagerService.listBooks();
    } catch (error) {
      console.error("Error fetching books with info:", error);
      throw error;
    }
  },

  // List local books only
  async getLocalBooks() {
    try {
      return await bookManagerService.listLocalBooks();
    } catch (error) {
      console.error("Error fetching local books:", error);
      throw error;
    }
  },

  // List cloud books only
  async getCloudBooks() {
    try {
      return await bookManagerService.listCloudBooks();
    } catch (error) {
      console.error("Error fetching cloud books:", error);
      throw error;
    }
  },

  // Get book statistics
  async getBookStats() {
    try {
      return await bookManagerService.getBookStats();
    } catch (error) {
      console.error("Error fetching book stats:", error);
      throw error;
    }
  },

  // Sync operations
  async syncBookWithCloud(bookId: string, direction: "push" | "pull") {
    try {
      return await bookManagerService.syncBookWithCloud(bookId, direction);
    } catch (error) {
      console.error("Error syncing book:", error);
      throw error;
    }
  },

  async exportBookToCloud(bookId: string) {
    try {
      return await bookManagerService.exportBookToCloud(bookId);
    } catch (error) {
      console.error("Error exporting book to cloud:", error);
      throw error;
    }
  },

  async importCloudBook(cloudBookId: string) {
    try {
      return await bookManagerService.importCloudBook(cloudBookId);
    } catch (error) {
      console.error("Error importing cloud book:", error);
      throw error;
    }
  },

  async getAvailableCloudBooks() {
    try {
      return await bookManagerService.getAvailableCloudBooks();
    } catch (error) {
      console.error("Error fetching available cloud books:", error);
      throw error;
    }
  },
};
