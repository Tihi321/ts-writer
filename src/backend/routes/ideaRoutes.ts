import express, { Request, Response, Router, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { getBookConfig, saveBookConfig, Idea } from "../dataManager";

const router: Router = express.Router({ mergeParams: true });

// Middleware to get bookName from request and attach it to the request object
// This relies on `mergeParams: true` and the parent router using `/books/:bookName`
const bindBookName = (req: Request, res: Response, next: NextFunction) => {
  // bookName is attached in chapterRoutes before this router is used.
  // We just need to ensure it's properly typed and available.
  if (!req.bookName) {
    // Fallback for direct testing or unexpected routing
    const { bookName } = req.params;
    if (typeof bookName !== "string") {
      return res.status(400).json({ message: "Book name is required in the path." });
    }
    req.bookName = bookName;
  }
  next();
};

router.use(bindBookName);

// All routes below will have req.bookName available

// GET /:chapterId/ideas - List all ideas
router.get("/", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const config = await getBookConfig(req.bookName!);

    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const ideas = config.ideas[chapterId] || [];
    res.json(ideas.sort((a, b) => a.order - b.order));
  } catch (error) {
    res.status(500).json({ message: "Error fetching ideas", error: (error as Error).message });
  }
});

// POST /:chapterId/ideas - Create a new idea
router.post("/", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Idea text is required" });
    }

    const config = await getBookConfig(req.bookName!);
    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterIdeas = config.ideas[chapterId] || [];
    const newIdea: Idea = {
      id: uuidv4(),
      text,
      order: chapterIdeas.length,
    };

    config.ideas[chapterId] = [...chapterIdeas, newIdea];
    await saveBookConfig(req.bookName!, config);
    res.status(201).json(newIdea);
  } catch (error) {
    res.status(500).json({ message: "Error creating idea", error: (error as Error).message });
  }
});

// PUT /:chapterId/ideas/:ideaId - Update an existing idea
router.put("/:ideaId", async (req: Request, res: Response) => {
  try {
    const { chapterId, ideaId } = req.params;
    const { text, order } = req.body;

    if (text === undefined && order === undefined) {
      return res.status(400).json({ message: "Text or order required" });
    }

    const config = await getBookConfig(req.bookName!);
    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterIdeas = config.ideas[chapterId] || [];
    const ideaIndex = chapterIdeas.findIndex((i) => i.id === ideaId);
    if (ideaIndex === -1) {
      return res.status(404).json({ message: "Idea not found" });
    }

    const ideaToUpdate = chapterIdeas[ideaIndex];
    if (text !== undefined) ideaToUpdate.text = text;
    if (order !== undefined) ideaToUpdate.order = order;

    // Re-sort if order was changed
    if (order !== undefined) {
      chapterIdeas.sort((a, b) => a.order - b.order);
    }

    await saveBookConfig(req.bookName!, config);
    res.json(ideaToUpdate);
  } catch (error) {
    res.status(500).json({ message: "Error updating idea", error: (error as Error).message });
  }
});

// DELETE /:chapterId/ideas/:ideaId - Delete an idea
router.delete("/:ideaId", async (req: Request, res: Response) => {
  try {
    const { chapterId, ideaId } = req.params;
    const config = await getBookConfig(req.bookName!);

    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterIdeas = config.ideas[chapterId] || [];
    const initialLength = chapterIdeas.length;
    config.ideas[chapterId] = chapterIdeas.filter((i) => i.id !== ideaId);

    if (config.ideas[chapterId].length === initialLength) {
      return res.status(404).json({ message: "Idea not found" });
    }

    // Optional: Re-normalize the order of remaining ideas
    config.ideas[chapterId].forEach((idea, index) => (idea.order = index));

    await saveBookConfig(req.bookName!, config);
    res.status(200).json({ message: "Idea deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting idea", error: (error as Error).message });
  }
});

// POST /:chapterId/ideas/reorder - Reorder ideas
router.post("/reorder", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { ideaOrder } = req.body; // Array of idea IDs

    if (!Array.isArray(ideaOrder)) {
      return res.status(400).json({ message: "Invalid idea order format." });
    }

    const config = await getBookConfig(req.bookName!);
    const chapterIdeas = config.ideas[chapterId] || [];
    const existingIds = new Set(chapterIdeas.map((i) => i.id));

    if (ideaOrder.length !== existingIds.size || !ideaOrder.every((id) => existingIds.has(id))) {
      return res.status(400).json({ message: "Idea order must match existing ideas." });
    }

    const ideaMap = new Map(chapterIdeas.map((i) => [i.id, i]));
    config.ideas[chapterId] = ideaOrder.map((id, index) => {
      const idea = ideaMap.get(id)!;
      return { ...idea, order: index };
    });

    await saveBookConfig(req.bookName!, config);
    res.status(200).json({
      message: "Ideas reordered successfully",
      ideas: config.ideas[chapterId],
    });
  } catch (error) {
    res.status(500).json({ message: "Error reordering ideas", error: (error as Error).message });
  }
});

export default router;
