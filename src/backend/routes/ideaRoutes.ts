import express, { Request, Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getBookConfig, saveBookConfig, Idea } from "../dataManager";

const router: Router = express.Router({ mergeParams: true }); // mergeParams allows access to :chapterId

// GET /api/chapters/:chapterId/ideas - List all ideas for a chapter
router.get("/", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const config = await getBookConfig();

    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const ideas = config.ideas[chapterId] || [];
    // Assuming ideas are stored with an 'order' field, sort by it if necessary
    // For now, returning as stored or an empty array if no ideas exist
    res.json(ideas.sort((a, b) => a.order - b.order));
  } catch (error) {
    console.error(`Error fetching ideas for chapter ${req.params.chapterId}:`, error);
    res.status(500).json({ message: "Error fetching ideas", error: (error as Error).message });
  }
});

// POST /api/chapters/:chapterId/ideas - Create a new idea for a chapter
router.post("/", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Idea text is required" });
    }

    const config = await getBookConfig();
    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const newIdeaId = uuidv4();
    const chapterIdeas = config.ideas[chapterId] || [];
    const newIdea: Idea = {
      id: newIdeaId,
      text,
      order: chapterIdeas.length, // Simple order by appending
    };

    config.ideas[chapterId] = [...chapterIdeas, newIdea];
    await saveBookConfig(config);
    res.status(201).json(newIdea);
  } catch (error) {
    console.error(`Error creating idea for chapter ${req.params.chapterId}:`, error);
    res.status(500).json({ message: "Error creating idea", error: (error as Error).message });
  }
});

// PUT /api/chapters/:chapterId/ideas/:ideaId - Update an existing idea
router.put("/:ideaId", async (req: Request, res: Response) => {
  try {
    const { chapterId, ideaId } = req.params;
    const { text, order } = req.body; // Optionally allow updating order here too

    if (!text && typeof order !== "number") {
      return res.status(400).json({ message: "Idea text or order is required for update" });
    }

    const config = await getBookConfig();
    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterIdeas = config.ideas[chapterId] || [];
    const ideaIndex = chapterIdeas.findIndex((idea) => idea.id === ideaId);

    if (ideaIndex === -1) {
      return res.status(404).json({ message: "Idea not found" });
    }

    let updated = false;
    if (text) {
      config.ideas[chapterId][ideaIndex].text = text;
      updated = true;
    }
    if (typeof order === "number") {
      config.ideas[chapterId][ideaIndex].order = order;
      updated = true;
      // If order changes, you might want to re-sort or re-normalize other orders
      // For simplicity, just updating the order value for now.
      // A more robust solution would re-sort based on the new order value.
    }

    if (updated) {
      // If order was part of the update, re-sort the ideas for this chapter
      if (typeof order === "number") {
        config.ideas[chapterId].sort((a, b) => a.order - b.order);
      }
      await saveBookConfig(config);
    }

    res.json(config.ideas[chapterId][ideaIndex]);
  } catch (error) {
    console.error(
      `Error updating idea ${req.params.ideaId} for chapter ${req.params.chapterId}:`,
      error
    );
    res.status(500).json({ message: "Error updating idea", error: (error as Error).message });
  }
});

// DELETE /api/chapters/:chapterId/ideas/:ideaId - Delete an idea
router.delete("/:ideaId", async (req: Request, res: Response) => {
  try {
    const { chapterId, ideaId } = req.params;
    const config = await getBookConfig();

    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterIdeas = config.ideas[chapterId] || [];
    const initialLength = chapterIdeas.length;
    config.ideas[chapterId] = chapterIdeas.filter((idea) => idea.id !== ideaId);

    if (config.ideas[chapterId].length === initialLength) {
      return res.status(404).json({ message: "Idea not found" });
    }

    // Optional: re-normalize order for remaining ideas if needed
    // config.ideas[chapterId].forEach((idea, index) => idea.order = index);

    await saveBookConfig(config);
    res.status(200).json({ message: "Idea deleted successfully" });
  } catch (error) {
    console.error(
      `Error deleting idea ${req.params.ideaId} for chapter ${req.params.chapterId}:`,
      error
    );
    res.status(500).json({ message: "Error deleting idea", error: (error as Error).message });
  }
});

// POST /api/chapters/:chapterId/ideas/reorder - Reorder ideas for a chapter
router.post("/reorder", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const { ideaOrder } = req.body; // Expects an array of idea IDs in the new order

    if (!Array.isArray(ideaOrder) || !ideaOrder.every((id) => typeof id === "string")) {
      return res
        .status(400)
        .json({ message: "Invalid ideaOrder format. Expected array of strings." });
    }

    const config = await getBookConfig();
    if (!config.chapters.find((ch) => ch.id === chapterId)) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const chapterIdeas = config.ideas[chapterId] || [];
    const existingIdeaIds = chapterIdeas.map((idea) => idea.id);

    if (
      ideaOrder.length !== existingIdeaIds.length ||
      !ideaOrder.every((id) => existingIdeaIds.includes(id)) ||
      !existingIdeaIds.every((id) => ideaOrder.includes(id))
    ) {
      return res
        .status(400)
        .json({
          message: "New idea order must contain all and only existing idea IDs for the chapter.",
        });
    }

    // Create a map for quick lookup of old ideas
    const ideaMap = new Map(chapterIdeas.map((idea) => [idea.id, idea]));

    // Create the new ordered list of ideas
    const reorderedIdeas: Idea[] = ideaOrder.map((id, index) => {
      const idea = ideaMap.get(id)!; // We've validated IDs, so ! is safe
      return { ...idea, order: index }; // Update order based on new position
    });

    config.ideas[chapterId] = reorderedIdeas;
    await saveBookConfig(config);
    res
      .status(200)
      .json({ message: "Ideas reordered successfully", ideas: config.ideas[chapterId] });
  } catch (error) {
    console.error(`Error reordering ideas for chapter ${req.params.chapterId}:`, error);
    res.status(500).json({ message: "Error reordering ideas", error: (error as Error).message });
  }
});

export default router;
