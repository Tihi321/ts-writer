import express, { Request, Response, Router } from "express";
import { listBooks, createBook } from "../dataManager";

const router: Router = express.Router();

// GET /api/books - List all books
router.get("/", async (req: Request, res: Response) => {
  try {
    const books = await listBooks();
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ message: "Error fetching books", error: (error as Error).message });
  }
});

// POST /api/books - Create a new book
router.post("/", async (req: Request, res: Response) => {
  const { bookName } = req.body;
  if (!bookName) {
    return res.status(400).json({ message: "Book name is required" });
  }

  try {
    await createBook(bookName);
    res.status(201).json({ message: `Book '${bookName}' created successfully` });
  } catch (error) {
    console.error(`Error creating book '${bookName}':`, error);
    res.status(500).json({ message: "Error creating book", error: (error as Error).message });
  }
});

export default router;
