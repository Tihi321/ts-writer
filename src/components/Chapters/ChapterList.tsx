import { Component, createSignal, For, Show } from "solid-js";
import { chapterStore } from "../../stores/chapterStore";
import { Chapter } from "../../stores/types";

const ChapterItem: Component<{
  chapter: Chapter;
  onDragStart: (e: DragEvent, chapter: Chapter) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent, targetChapter: Chapter) => void;
}> = (props) => {
  const [isEditing, setIsEditing] = createSignal(false);
  const [editTitle, setEditTitle] = createSignal(props.chapter.title);
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  const isSelected = () => chapterStore.selectedChapter()?.id === props.chapter.id;

  const handleEdit = () => {
    setEditTitle(props.chapter.title);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editTitle().trim()) {
      alert("Chapter title cannot be empty.");
      return;
    }

    if (editTitle().trim() === props.chapter.title) {
      setIsEditing(false);
      return;
    }

    try {
      await chapterStore.updateChapterTitle(props.chapter.id, editTitle().trim());
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update chapter title.");
      console.error(error);
    }
  };

  const handleCancelEdit = () => {
    setEditTitle(props.chapter.title);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    try {
      await chapterStore.deleteChapter(props.chapter.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      alert("Failed to delete chapter.");
      console.error(error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  return (
    <div
      class="p-3 cursor-pointer transition-all duration-200 select-none group relative border"
      classList={{
        "border-gray-600 text-gray-900": isSelected(),
        "border-gray-300 text-gray-700 hover:border-gray-400": !isSelected(),
      }}
      draggable={!isEditing()}
      onDragStart={(e) => !isEditing() && props.onDragStart(e, props.chapter)}
      onDragOver={props.onDragOver}
      onDrop={(e) => props.onDrop(e, props.chapter)}
      onClick={() => !isEditing() && chapterStore.selectChapter(props.chapter.id)}
    >
      <div class="flex items-center">
        <Show when={!isEditing()}>
          <span
            class="mr-3 cursor-grab text-lg transition-colors"
            classList={{
              "text-gray-600": isSelected(),
              "text-gray-400 group-hover:text-gray-600": !isSelected(),
            }}
          >
            ⋮⋮
          </span>
        </Show>

        <Show
          when={isEditing()}
          fallback={
            <div class="flex-1 flex items-center justify-between">
              <span class="font-medium">{props.chapter.title}</span>
              <div class="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  class="p-1 border border-gray-300 hover:border-gray-400 transition-colors"
                  classList={{
                    "text-gray-600 hover:text-gray-800": isSelected(),
                    "text-gray-400 hover:text-gray-600": !isSelected(),
                  }}
                  title="Edit chapter title"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  class="text-gray-500 hover:text-gray-700 p-1 border border-gray-300 hover:border-gray-400 transition-colors"
                  title="Delete chapter"
                >
                  🗑️
                </button>
              </div>
            </div>
          }
        >
          <div class="flex items-center space-x-2 flex-1">
            <input
              type="text"
              value={editTitle()}
              onInput={(e) => setEditTitle(e.currentTarget.value)}
              onKeyDown={handleKeyPress}
              class="flex-1 px-3 py-1 border border-gray-300 text-sm text-gray-900 focus:border-gray-500 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
              autofocus
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit();
              }}
              class="text-gray-600 hover:text-gray-800 text-sm p-1 border border-gray-300 hover:border-gray-400"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
              class="text-gray-500 hover:text-gray-700 text-sm p-1 border border-gray-300 hover:border-gray-400"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        </Show>
      </div>

      {/* Delete Confirmation Modal */}
      <Show when={showDeleteConfirm()}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-6 border border-gray-300 shadow-lg max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold mb-4 text-gray-900">Delete Chapter</h3>
            <p class="text-gray-600 mb-6">
              Are you sure you want to delete "{props.chapter.title}"? This action cannot be undone.
            </p>
            <div class="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                class="px-4 py-2 text-gray-600 border border-gray-300 hover:text-gray-800 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                class="px-4 py-2 text-gray-800 border border-gray-600 hover:text-gray-900 hover:border-gray-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

const ChapterList: Component = () => {
  const [newChapterTitle, setNewChapterTitle] = createSignal("");
  const [draggedChapter, setDraggedChapter] = createSignal<Chapter | null>(null);

  const handleAddChapter = async () => {
    if (!newChapterTitle().trim()) {
      alert("Chapter title cannot be empty.");
      return;
    }

    try {
      await chapterStore.createNewChapter(newChapterTitle());
      setNewChapterTitle("");
    } catch (error) {
      alert("Failed to add chapter.");
      console.error(error);
    }
  };

  const handleDragStart = (e: DragEvent, chapter: Chapter) => {
    setDraggedChapter(chapter);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", chapter.id);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDrop = async (e: DragEvent, targetChapter: Chapter) => {
    e.preventDefault();
    const draggedChapterItem = draggedChapter();

    if (!draggedChapterItem || draggedChapterItem.id === targetChapter.id) {
      setDraggedChapter(null);
      return;
    }

    const currentChapters = chapterStore.chapters();
    const draggedIndex = currentChapters.findIndex((c) => c.id === draggedChapterItem.id);
    const targetIndex = currentChapters.findIndex((c) => c.id === targetChapter.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedChapter(null);
      return;
    }

    // Create new order array
    const newChapters = [...currentChapters];
    const [removed] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(targetIndex, 0, removed);

    // Extract the new order of IDs
    const newOrder = newChapters.map((chapter) => chapter.id);

    try {
      await chapterStore.reorderChapters(newOrder);
    } catch (error) {
      console.error("Failed to reorder chapters:", error);
    }

    setDraggedChapter(null);
  };

  return (
    <div class="p-6 h-full">
      <Show when={chapterStore.loading()}>
        <p class="text-gray-500">Loading chapters...</p>
      </Show>

      <Show when={chapterStore.error()}>
        <p class="text-gray-500">{chapterStore.error()}</p>
      </Show>

      <div class="space-y-2 mb-6">
        <For
          each={chapterStore.chapters()}
          fallback={
            <div class="text-center p-8 border-2 border-dashed border-gray-300">
              <div class="text-3xl mb-2">📖</div>
              <p class="text-sm text-gray-500">No chapters yet</p>
              <p class="text-xs text-gray-400 mt-1">Create your first chapter below</p>
            </div>
          }
        >
          {(chapter) => (
            <ChapterItem
              chapter={chapter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}
        </For>
      </div>

      <div class="space-y-3">
        <input
          type="text"
          class="w-full p-3 border border-gray-300 text-gray-800 focus:border-gray-500 focus:outline-none"
          placeholder="New chapter title..."
          value={newChapterTitle()}
          onInput={(e) => setNewChapterTitle(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAddChapter();
            }
          }}
        />
        <button
          onClick={handleAddChapter}
          class="w-full border border-gray-600 text-gray-800 hover:text-gray-900 hover:border-gray-700 font-medium py-3 px-4 transition-colors duration-200"
        >
          📚 Add Chapter
        </button>
      </div>
    </div>
  );
};

export default ChapterList;
