import { Component, createSignal, For, Show } from "solid-js";
import { chapterStore } from "../../stores/chapterStore";
import { ideaStore } from "../../stores/ideaStore";
import { Idea } from "../../stores/types";

const IdeaItem: Component<{
  idea: Idea;
  onDragStart: (e: DragEvent, idea: Idea) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent, targetIdea: Idea) => void;
}> = (props) => {
  return (
    <div
      class="p-3 bg-yellow-100 border border-yellow-200 rounded-md shadow-sm cursor-pointer"
      draggable={true}
      onDragStart={(e) => props.onDragStart(e, props.idea)}
      onDragOver={props.onDragOver}
      onDrop={(e) => props.onDrop(e, props.idea)}
    >
      <div class="flex items-start">
        <span class="mr-2 text-yellow-600 cursor-grab text-xs">⋮⋮</span>
        <p class="text-sm text-yellow-800 flex-1">{props.idea.text}</p>
      </div>
    </div>
  );
};

const IdeasSidebar: Component = () => {
  const [newIdeaText, setNewIdeaText] = createSignal("");
  const [draggedIdea, setDraggedIdea] = createSignal<Idea | null>(null);

  const handleAddIdea = async () => {
    if (!newIdeaText().trim()) {
      alert("Idea text cannot be empty.");
      return;
    }

    try {
      await ideaStore.createNewIdea(newIdeaText());
      setNewIdeaText("");
    } catch (error) {
      alert("Failed to add idea.");
      console.error(error);
    }
  };

  const handleDragStart = (e: DragEvent, idea: Idea) => {
    setDraggedIdea(idea);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", idea.id);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = async (e: DragEvent, targetIdea: Idea) => {
    e.preventDefault();
    const draggedIdeaItem = draggedIdea();

    if (!draggedIdeaItem || draggedIdeaItem.id === targetIdea.id) {
      setDraggedIdea(null);
      return;
    }

    const currentIdeas = ideaStore.ideas();
    const draggedIndex = currentIdeas.findIndex((i) => i.id === draggedIdeaItem.id);
    const targetIndex = currentIdeas.findIndex((i) => i.id === targetIdea.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedIdea(null);
      return;
    }

    // Create new order array
    const newIdeas = [...currentIdeas];
    const [removed] = newIdeas.splice(draggedIndex, 1);
    newIdeas.splice(targetIndex, 0, removed);

    // Extract the new order of IDs
    const newOrder = newIdeas.map((idea) => idea.id);

    try {
      await ideaStore.reorderIdeas(newOrder);
    } catch (error) {
      console.error("Failed to reorder ideas:", error);
    }

    setDraggedIdea(null);
  };

  return (
    <Show
      when={chapterStore.selectedChapter()}
      fallback={
        <div class="p-4 flex items-center justify-center h-full text-gray-500">
          Select a chapter to see its ideas.
        </div>
      }
    >
      <div class="p-4">
        <h2 class="text-xl font-semibold mb-3 text-gray-700">
          Ideas for "{chapterStore.selectedChapter()?.title}"
        </h2>

        <Show when={ideaStore.loading()}>
          <p class="text-gray-500">Loading ideas...</p>
        </Show>

        <div class="space-y-2 mb-4">
          <For
            each={ideaStore.ideas()}
            fallback={<p class="text-sm text-gray-400">No ideas for this chapter yet.</p>}
          >
            {(idea: Idea) => (
              <IdeaItem
                idea={idea}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            )}
          </For>
        </div>

        <textarea
          class="w-full p-2 border border-gray-300 rounded mb-2 h-24"
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
