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
      class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer group relative hover:shadow-md transition-all duration-200 hover:border-gray-300"
      draggable={!isEditing()}
      onDragStart={(e) => !isEditing() && props.onDragStart(e, props.idea)}
      onDragOver={props.onDragOver}
      onDrop={(e) => props.onDrop(e, props.idea)}
    >
      <div class="flex items-start">
        <Show when={!isEditing()}>
          <span class="mr-3 text-gray-400 cursor-grab text-lg hover:text-gray-600 transition-colors">
            ⋮⋮
          </span>
        </Show>

        <Show
          when={isEditing()}
          fallback={
            <div class="flex-1 flex items-start justify-between">
              <p class="text-sm typewriter-text text-gray-700 flex-1 leading-relaxed">
                {props.idea.text}
              </p>
              <div class="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2 ml-3 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  class="text-gray-500 hover:text-gray-700 text-lg p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Edit idea"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  class="text-red-500 hover:text-red-700 text-lg p-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete idea"
                >
                  🗑️
                </button>
              </div>
            </div>
          }
        >
          <div class="flex-1 flex flex-col space-y-3">
            <textarea
              value={editText()}
              onInput={(e) => setEditText(e.currentTarget.value)}
              onKeyDown={handleKeyPress}
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm typewriter-text resize-none bg-white focus:border-gray-500 focus:outline-none"
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
                class="text-green-700 hover:text-green-900 text-sm px-3 py-1 bg-green-50 hover:bg-green-100 rounded-md font-medium transition-colors border border-green-200"
                title="Save"
              >
                ✓ Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelEdit();
                }}
                class="text-gray-600 hover:text-gray-800 text-sm px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-md font-medium transition-colors border border-gray-200"
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
          <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-gray-200">
            <h3 class="text-lg font-semibold mb-4 text-gray-900">Delete Idea</h3>
            <p class="text-gray-600 mb-4">Are you sure you want to delete this idea?</p>
            <div class="bg-gray-50 p-3 rounded-md mb-4 text-sm text-gray-700 max-h-20 overflow-y-auto border border-gray-200">
              "{props.idea.text}"
            </div>
            <div class="flex space-x-3">
              <button
                onClick={handleDelete}
                class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
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
        <div class="p-6 flex items-center justify-center h-full text-gray-500 bg-gray-50">
          <div class="text-center">
            <div class="text-5xl mb-4">💡</div>
            <p class="font-medium text-lg text-gray-700">Select a chapter to capture ideas</p>
            <p class="text-sm text-gray-500 mt-2">Your thoughts matter...</p>
          </div>
        </div>
      }
    >
      <div class="p-6 bg-gray-50 h-full">
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-2 flex items-center">
            <span class="text-2xl mr-2">💡</span>
            Ideas & Notes
          </h2>
          <p class="text-sm text-gray-600">for "{chapterStore.selectedChapter()?.title}"</p>
        </div>

        <Show when={ideaStore.loading()}>
          <p class="text-gray-500">Loading ideas...</p>
        </Show>

        <div class="space-y-3 mb-6">
          <For
            each={ideaStore.ideas()}
            fallback={
              <div class="text-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div class="text-3xl mb-2">📝</div>
                <p class="text-sm text-gray-500">No ideas captured yet</p>
                <p class="text-xs text-gray-400 mt-1">Start writing your thoughts below</p>
              </div>
            }
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

        <div class="space-y-3">
          <textarea
            class="w-full p-4 border border-gray-300 rounded-lg typewriter-text h-24 bg-white focus:border-gray-500 focus:outline-none resize-none"
            placeholder="Capture a new idea..."
            value={newIdeaText()}
            onInput={(e) => setNewIdeaText(e.currentTarget.value)}
          />
          <button
            onClick={handleAddIdea}
            class="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm"
          >
            💡 Add Idea
          </button>
        </div>
      </div>
    </Show>
  );
};

export default IdeasSidebar;
