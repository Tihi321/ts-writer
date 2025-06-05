const API_BASE_URL = "/api";

export const bookService = {
  // GET /api/books
  async getAllBooks(): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/books`);
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }
      return (await response.json()) as string[];
    } catch (error) {
      console.error("Error fetching all books:", error);
      throw error;
    }
  },

  // POST /api/books
  async createBook(bookName: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookName }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create book: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error creating book:", error);
      throw error;
    }
  },
};
