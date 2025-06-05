import express, { Request, Response, Router, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  getBookConfig,
  saveBookConfig,
  getChapterContent,
  saveChapterContent,
  deleteChapterFile,
  Chapter,
} from "../dataManager";
import ideaRoutes from "./ideaRoutes";

const router: Router = express.Router({ mergeParams: true });

// Middleware to get bookName from params and attach to request
// This ensures all subsequent routes have access to `req.bookName`
const bindBookName = (req: Request, res: Response, next: NextFunction) => {
  const { bookName } = req.params;
  if (typeof bookName !== "string") {
    return res.status(400).json({ message: "A book name must be provided in the URL path." });
  }
  req.bookName = bookName;
  next();
};

// Apply middleware to all routes in this router
router.use(bindBookName);

// Pass bookName to ideaRoutes
router.use(
  "/:chapterId/ideas",
  (req: Request, res: Response, next: NextFunction) => {
    // The bindBookName middleware has already attached it.
    // This just ensures the chain continues.
    next();
  },
  ideaRoutes
);

// GET /:bookName/chapters - List all chapters
router.get("/", async (req: Request, res: Response) => {
  try {
    const config = await getBookConfig(req.bookName!);
    const sortedChapters = config.chapterOrder
      .map((id) => config.chapters.find((ch) => ch.id === id))
      .filter(Boolean) as Chapter[];
    res.json(sortedChapters);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chapters", error: (error as Error).message });
  }
});

// POST /:bookName/chapters - Create a new chapter
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const config = await getBookConfig(req.bookName!);
    const newChapterId = uuidv4();
    const fileName = `${title.toLowerCase().replace(/\s+/g, "-")}-${newChapterId.slice(0, 8)}.md`;

    const newChapter: Chapter = { id: newChapterId, title, fileName };

    await saveChapterContent(req.bookName!, fileName, `# ${title}\n\nStart writing...`);

    config.chapters.push(newChapter);
    config.chapterOrder.push(newChapterId);
    config.ideas[newChapterId] = [];

    await saveBookConfig(req.bookName!, config);
    res.status(201).json(newChapter);
  } catch (error) {
    res.status(500).json({ message: "Error creating chapter", error: (error as Error).message });
  }
});

// GET /:bookName/chapters/:chapterId - Get a specific chapter
router.get("/:chapterId", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const config = await getBookConfig(req.bookName!);
    const chapter = config.chapters.find((ch) => ch.id === chapterId);

    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    const content = await getChapterContent(req.bookName!, chapter.fileName);
    res.json({ ...chapter, content });
  } catch (error) {
    res.status(500).json({ message: "Error fetching chapter", error: (error as Error).message });
  }
});

// PUT /:bookName/chapters/:chapterId - Update a chapter
router.put("/:chapterId", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { title, content } = req.body;

    const config = await getBookConfig(req.bookName!);
    const chapterIndex = config.chapters.findIndex((ch) => ch.id === chapterId);

    if (chapterIndex === -1) return res.status(404).json({ message: "Chapter not found" });

    const chapter = config.chapters[chapterIndex];
    let configChanged = false;

    if (title && title !== chapter.title) {
      chapter.title = title;
      configChanged = true;
    }

    if (typeof content === "string") {
      await saveChapterContent(req.bookName!, chapter.fileName, content);
    }

    if (configChanged) {
      await saveBookConfig(req.bookName!, config);
    }

    const updatedContent = await getChapterContent(req.bookName!, chapter.fileName);
    res.json({ ...chapter, content: updatedContent });
  } catch (error) {
    res.status(500).json({ message: "Error updating chapter", error: (error as Error).message });
  }
});

// DELETE /:bookName/chapters/:chapterId - Delete a chapter
router.delete("/:chapterId", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const config = await getBookConfig(req.bookName!);
    const chapterIndex = config.chapters.findIndex((ch) => ch.id === chapterId);

    if (chapterIndex === -1) return res.status(404).json({ message: "Chapter not found" });

    const chapter = config.chapters[chapterIndex];

    await deleteChapterFile(req.bookName!, chapter.fileName);

    config.chapters.splice(chapterIndex, 1);
    config.chapterOrder = config.chapterOrder.filter((id) => id !== chapterId);
    delete config.ideas[chapterId];

    await saveBookConfig(req.bookName!, config);
    res.status(200).json({ message: "Chapter deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting chapter", error: (error as Error).message });
  }
});

// POST /:bookName/chapters/reorder - Reorder chapters
router.post("/reorder", async (req: Request, res: Response) => {
  try {
    const { chapterOrder } = req.body;

    if (!Array.isArray(chapterOrder)) {
      return res.status(400).json({ message: "Invalid chapter order format." });
    }

    const config = await getBookConfig(req.bookName!);
    const existingIds = new Set(config.chapters.map((c) => c.id));

    if (
      chapterOrder.length !== existingIds.size ||
      !chapterOrder.every((id) => existingIds.has(id))
    ) {
      return res
        .status(400)
        .json({ message: "Chapter order must contain all and only existing chapter IDs." });
    }

    config.chapterOrder = chapterOrder;
    await saveBookConfig(req.bookName!, config);

    // Return the reordered chapters
    const sortedChapters = config.chapterOrder
      .map((id) => config.chapters.find((ch) => ch.id === id))
      .filter(Boolean) as Chapter[];

    res.status(200).json({
      message: "Chapter order updated successfully",
      chapterOrder,
      chapters: sortedChapters,
    });
  } catch (error) {
    res.status(500).json({ message: "Error reordering chapters", error: (error as Error).message });
  }
});

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      bookName?: string;
    }
  }
}

export default router;
