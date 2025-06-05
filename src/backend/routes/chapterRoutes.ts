import express, { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  getBookConfig,
  saveBookConfig,
  getChapterContent,
  saveChapterContent,
  deleteChapterFile,
  Chapter,
  BookConfig,
} from "../dataManager";

// Import idea routes
import ideaRoutes from "./ideaRoutes";

const router: Router = express.Router();

// Mount idea routes for a specific chapter
// This will make ideaRoutes handle requests like /api/chapters/:chapterId/ideas
router.use("/:chapterId/ideas", ideaRoutes);

// GET /api/chapters - List all chapters with their metadata
router.get("/", async (req: Request, res: Response) => {
  try {
    const config = await getBookConfig();
    // Return chapters sorted by chapterOrder
    const sortedChapters = config.chapterOrder
      .map((id) => config.chapters.find((ch) => ch.id === id))
      .filter((ch) => ch !== undefined) as Chapter[];
    res.json(sortedChapters);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({ message: "Error fetching chapters", error: (error as Error).message });
  }
});

// POST /api/chapters - Create a new chapter
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const config = await getBookConfig();
    const newChapterId = uuidv4();
    // Sanitize title to create a safe filename
    const fileName = `${title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")}-${newChapterId.substring(0, 8)}.md`;

    const newChapter: Chapter = {
      id: newChapterId,
      title,
      fileName,
    };

    await saveChapterContent(fileName, `# ${title}\n\nStart writing your chapter here...`); // Create with initial content

    config.chapters.push(newChapter);
    config.chapterOrder.push(newChapterId);
    config.ideas[newChapterId] = []; // Initialize ideas array for the new chapter

    await saveBookConfig(config);
    res.status(201).json(newChapter);
  } catch (error) {
    console.error("Error creating new chapter:", error);
    res
      .status(500)
      .json({ message: "Error creating new chapter", error: (error as Error).message });
  }
});

// GET /api/chapters/:chapterId - Get a specific chapter's details (metadata and content)
router.get("/:chapterId", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const config = await getBookConfig();
    const chapter = config.chapters.find((ch) => ch.id === chapterId);

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const content = await getChapterContent(chapter.fileName);
    res.json({ ...chapter, content });
  } catch (error) {
    console.error("Error fetching chapter details:", error);
    // Check if error is due to file not found from getChapterContent
    if ((error as Error).message.includes("not found or unreadable")) {
      return res
        .status(404)
        .json({ message: "Chapter content not found", error: (error as Error).message });
    }
    res
      .status(500)
      .json({ message: "Error fetching chapter details", error: (error as Error).message });
  }
});

// PUT /api/chapters/:chapterId - Update a chapter's content or metadata (title)
router.put("/:chapterId", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { title, content } = req.body;

    const config = await getBookConfig();
    const chapterIndex = config.chapters.findIndex((ch) => ch.id === chapterId);

    if (chapterIndex === -1) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterToUpdate = config.chapters[chapterIndex];
    let updated = false;

    if (title && title !== chapterToUpdate.title) {
      // Note: Changing title might ideally change fileName too, but that adds complexity.
      // For now, only update title in metadata.
      chapterToUpdate.title = title;
      updated = true;
    }

    if (typeof content === "string") {
      await saveChapterContent(chapterToUpdate.fileName, content);
      // No direct metadata change for content update, but we acknowledge it happened.
    }

    if (updated) {
      // Only save config if metadata (like title) changed
      await saveBookConfig(config);
    }

    // Return the potentially updated chapter metadata along with content
    const currentContent = await getChapterContent(chapterToUpdate.fileName);
    res.json({ ...chapterToUpdate, content: currentContent });
  } catch (error) {
    console.error("Error updating chapter:", error);
    res.status(500).json({ message: "Error updating chapter", error: (error as Error).message });
  }
});

// DELETE /api/chapters/:chapterId - Delete a chapter
router.delete("/:chapterId", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const config = await getBookConfig();

    const chapterIndex = config.chapters.findIndex((ch) => ch.id === chapterId);
    if (chapterIndex === -1) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterToDelete = config.chapters[chapterIndex];

    // Delete the markdown file
    await deleteChapterFile(chapterToDelete.fileName);

    // Remove from config
    config.chapters.splice(chapterIndex, 1);
    config.chapterOrder = config.chapterOrder.filter((id) => id !== chapterId);
    delete config.ideas[chapterId]; // Remove associated ideas

    await saveBookConfig(config);
    res.status(200).json({ message: "Chapter deleted successfully" });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    res.status(500).json({ message: "Error deleting chapter", error: (error as Error).message });
  }
});

// POST /api/chapters/reorder - Update the order of chapters
router.post("/reorder", async (req: Request, res: Response) => {
  try {
    const { chapterOrder } = req.body; // Expects an array of chapter IDs in the new order
    if (!Array.isArray(chapterOrder) || !chapterOrder.every((id) => typeof id === "string")) {
      return res
        .status(400)
        .json({ message: "Invalid chapterOrder format. Expected array of strings." });
    }

    const config = await getBookConfig();
    // Validate that all provided IDs exist in the current chapters
    const allChapterIds = config.chapters.map((ch) => ch.id);
    if (!chapterOrder.every((id) => allChapterIds.includes(id))) {
      return res.status(400).json({ message: "Invalid chapter ID found in reorder list." });
    }
    // Validate that all existing chapters are included in the new order
    if (
      chapterOrder.length !== allChapterIds.length ||
      !allChapterIds.every((id) => chapterOrder.includes(id))
    ) {
      return res
        .status(400)
        .json({ message: "New order must include all existing chapter IDs exactly once." });
    }

    config.chapterOrder = chapterOrder;
    await saveBookConfig(config);
    res.status(200).json({ message: "Chapter order updated successfully", chapterOrder });
  } catch (error) {
    console.error("Error reordering chapters:", error);
    res.status(500).json({ message: "Error reordering chapters", error: (error as Error).message });
  }
});

export default router;
