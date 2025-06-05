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
  const [isEditing, setIsEditing] = createSignal(false);
  const [editText, setEditText] = createSignal(props.idea.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  const handleEdit = () => {
    setEditText(props.idea.text);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editText().trim()) {
      alert("Idea text cannot be empty.");
      return;
    }

    if (editText().trim() === props.idea.text) {
      setIsEditing(false);
      return;
    }

    try {
      await ideaStore.updateIdea(props.idea.id, editText().trim());
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update idea.");
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditText(props.idea.text);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await ideaStore.deleteIdea(props.idea.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      alert("Failed to delete idea.");
      console.error(error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div
      class="p-3 bg-yellow-100 border border-yellow-200 rounded-md shadow-sm cursor-pointer group relative"
      draggable={!isEditing()}
      onDragStart={(e) => !isEditing() && props.onDragStart(e, props.idea)}
      onDragOver={props.onDragOver}
      onDrop={(e) => props.onDrop(e, props.idea)}
    >
      <div class="flex items-start">
        <Show when={!isEditing()}>
          <span class="mr-2 text-yellow-600 cursor-grab text-xs">⋮⋮</span>
        </Show>

        <Show
          when={isEditing()}
          fallback={
            <div class="flex-1 flex items-start justify-between">
              <p class="text-sm text-yellow-800 flex-1">{props.idea.text}</p>
              <div class="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 ml-2 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  class="text-blue-500 hover:text-blue-700 text-sm p-1"
                  title="Edit idea"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  class="text-red-500 hover:text-red-700 text-sm p-1"
                  title="Delete idea"
                >
                  🗑️
                </button>
              </div>
            </div>
          }
        >
          <div class="flex-1 flex flex-col space-y-2">
            <textarea
              value={editText()}
              onInput={(e) => setEditText(e.currentTarget.value)}
              onKeyDown={handleKeyPress}
              class="flex-1 px-2 py-1 border border-gray-300 rounded text-sm resize-none"
              onClick={(e) => e.stopPropagation()}
              rows="3"
              autofocus
            />
            <div class="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveEdit();
                }}
                class="text-green-600 hover:text-green-800 text-sm px-2 py-1 bg-green-100 rounded"
                title="Save"
              >
                ✓ Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                class="text-gray-500 hover:text-gray-700 text-sm px-2 py-1 bg-gray-100 rounded"
                title="Cancel"
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </Show>
      </div>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteConfirm()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <h3 class="text-lg font-semibold mb-4">Delete Idea</h3>
            <p class="text-gray-600 mb-4">Are you sure you want to delete this idea?</p>
            <div class="bg-yellow-50 p-3 rounded mb-4 text-sm text-gray-700 max-h-20 overflow-y-auto">
              "{props.idea.text}"
            </div>
            <div class="flex space-x-3">
              <button
                onClick={handleDelete}
                class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Show>
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
