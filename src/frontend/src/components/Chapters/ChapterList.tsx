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
      class="p-3 rounded-lg cursor-pointer transition-all duration-200 select-none group relative border"
      classList={{
        "bg-gray-900 border-gray-900 text-white shadow-sm": isSelected(),
        "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300":
          !isSelected(),
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
              "text-gray-400": isSelected(),
              "text-gray-300 group-hover:text-gray-500": !isSelected(),
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
                  class="p-1 rounded transition-colors"
                  classList={{
                    "text-gray-400 hover:text-gray-200": isSelected(),
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
                  class="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                  title="Delete chapter"
                >
                  🗑️
                </button>
              </div>
            </div>
          }
        >
          <div class="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={editTitle()}
              onInput={(e) => setEditTitle(e.currentTarget.value)}
              onKeyDown={handleKeyPress}
              class="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:border-gray-500 focus:outline-none"
              onClick={(e) => e.stopPropagation()}
              autofocus
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit();
              }}
              class="text-green-600 hover:text-green-800 text-sm p-1 rounded"
              title="Save"
            >
              ✓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancelEdit();
              }}
              class="text-gray-500 hover:text-gray-700 text-sm p-1 rounded"
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
          <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-gray-200">
            <h3 class="text-lg font-semibold mb-4 text-gray-900">Delete Chapter</h3>
            <p class="text-gray-600 mb-6">
              Are you sure you want to delete "{props.chapter.title}"? This action cannot be undone.
            </p>
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

const ChapterList: Component = () => {
  const [isAdding, setIsAdding] = createSignal(false);
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
      setIsAdding(false);
    } catch (error) {
      alert("Failed to create chapter.");
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
    const draggedChap = draggedChapter();
    if (!draggedChap || draggedChap.id === targetChapter.id) {
      setDraggedChapter(null);
      return;
    }

    const currentChapters = chapterStore.chapters();
    const draggedIndex = currentChapters.findIndex((c) => c.id === draggedChap.id);
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
    <div class="p-6 bg-gray-50 h-full">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 flex items-center">
        <span class="text-2xl mr-2">📚</span>
        Chapters
      </h2>

      <Show when={chapterStore.loading()}>
        <p class="text-gray-500">Loading chapters...</p>
      </Show>

      <Show when={chapterStore.error()}>
        <p class="text-red-500">{chapterStore.error()}</p>
      </Show>

      <div class="space-y-2 mb-6">
        <For
          each={chapterStore.chapters()}
          fallback={
            <div class="text-center p-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
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
        <Show
          when={isAdding()}
          fallback={
            <button
              onClick={() => setIsAdding(true)}
              class="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-sm"
            >
              + New Chapter
            </button>
          }
        >
          <input
            type="text"
            placeholder="Chapter title..."
            value={newChapterTitle()}
            onInput={(e) => setNewChapterTitle(e.currentTarget.value)}
            class="w-full p-3 border border-gray-300 rounded-lg bg-white focus:border-gray-500 focus:outline-none"
            onKeyPress={(e) => e.key === "Enter" && handleAddChapter()}
            autofocus
          />
          <div class="flex space-x-2">
            <button
              onClick={handleAddChapter}
              class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setIsAdding(false)}
              class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default ChapterList;
