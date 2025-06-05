import { Component, createEffect, createSignal, For, Show } from "solid-js";
import { chapterStore } from "../../stores/chapterStore";
import { ideaStore, setIdeaStore } from "../../stores/ideaStore";
import { ideaService } from "../../services/ideaService";
import { Idea } from "../../stores/types";

const IdeasSidebar: Component = () => {
  const [newIdeaText, setNewIdeaText] = createSignal("");

  // Effect to fetch ideas whenever the selected chapter changes
  createEffect(async () => {
    const chapterId = chapterStore.selectedChapterId;
    if (chapterId) {
      setIdeaStore("isLoading", true);
      try {
        const ideas = await ideaService.getIdeasForChapter(chapterId);
        setIdeaStore("ideas", ideas);
      } catch (error) {
        setIdeaStore("error", "Failed to load ideas.");
        console.error(error);
      } finally {
        setIdeaStore("isLoading", false);
      }
    } else {
      // Clear ideas if no chapter is selected
      setIdeaStore("ideas", []);
    }
  });

  const selectedChapterTitle = () => {
    return (
      chapterStore.chapters.find((ch) => ch.id === chapterStore.selectedChapterId)?.title || ""
    );
  };

  const handleAddIdea = async () => {
    const chapterId = chapterStore.selectedChapterId;
    if (!chapterId) {
      alert("No chapter selected to add an idea to.");
      return;
    }
    if (!newIdeaText().trim()) {
      alert("Idea text cannot be empty.");
      return;
    }

    try {
      const newIdea = await ideaService.createIdea(chapterId, newIdeaText());
      setIdeaStore("ideas", (ideas) => [...ideas, newIdea]);
      setNewIdeaText("");
    } catch (error) {
      alert("Failed to add idea.");
      console.error(error);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const chapterId = chapterStore.selectedChapterId;
    if (!chapterId || !confirm("Are you sure you want to delete this idea?")) {
      return;
    }

    try {
      await ideaService.deleteIdea(chapterId, ideaId);
      setIdeaStore("ideas", (ideas) => ideas.filter((idea) => idea.id !== ideaId));
    } catch (error) {
      alert("Failed to delete idea.");
      console.error(error);
    }
  };

  return (
    <Show
      when={chapterStore.selectedChapterId}
      fallback={
        <div class="flex items-center justify-center h-full text-gray-500">
          Select a chapter to see its ideas.
        </div>
      }
    >
      <div>
        <h2 class="text-xl font-semibold mb-3 text-gray-700">
          Ideas for "{selectedChapterTitle()}"
        </h2>

        <Show when={ideaStore.isLoading}>
          <p class="text-gray-500">Loading ideas...</p>
        </Show>

        <div class="space-y-2 mb-4">
          <For
            each={ideaStore.ideas}
            fallback={<p class="text-sm text-gray-400">No ideas for this chapter yet.</p>}
          >
            {(idea: Idea) => (
              <div class="p-3 bg-yellow-100 border border-yellow-200 rounded-md shadow-sm">
                <p class="text-sm text-yellow-800">{idea.text}</p>
                <div class="mt-1 text-right">
                  <button
                    class="text-xs text-yellow-600 hover:text-yellow-800 mr-1 disabled:text-gray-400"
                    disabled
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteIdea(idea.id)}
                    class="text-xs text-red-500 hover:text-red-700"
                  >
                    Del
                  </button>
                </div>
              </div>
            )}
          </For>
        </div>

        <textarea
          class="w-full p-2 border border-gray-300 rounded mb-2 h-24 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="New idea..."
          value={newIdeaText()}
          onInput={(e) => setNewIdeaText(e.currentTarget.value)}
        />
        <button
          onClick={handleAddIdea}
          class="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-2 px-4 rounded"
        >
          Add Idea
        </button>
      </div>
    </Show>
  );
};

export default IdeasSidebar;
