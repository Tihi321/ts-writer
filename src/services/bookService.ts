import { dataService } from "./dataService";

export const bookService = {
  // List all books
  async getAllBooks(): Promise<string[]> {
    try {
      return await dataService.listBooks();
    } catch (error) {
      console.error("Error fetching all books:", error);
      throw error;
    }
  },

  // Create a new book
  async createBook(bookName: string): Promise<void> {
    try {
      await dataService.createBook(bookName);
    } catch (error) {
      console.error("Error creating book:", error);
      throw error;
    }
  },

  // Delete a book
  async deleteBook(bookName: string): Promise<void> {
    try {
      await dataService.deleteBook(bookName);
    } catch (error) {
      console.error("Error deleting book:", error);
      throw error;
    }
  },
};
