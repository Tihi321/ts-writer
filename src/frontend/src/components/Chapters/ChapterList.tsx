import { Component, createSignal, For, Show } from "solid-js";
import { chapterStore } from "../../stores/chapterStore";
import { Chapter } from "../../stores/types";

const ChapterItem: Component<{
  chapter: Chapter;
  onDragStart: (e: DragEvent, chapter: Chapter) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent, targetChapter: Chapter) => void;
}> = (props) => {
  const isSelected = () => chapterStore.selectedChapter()?.id === props.chapter.id;

  return (
    <div
      class="p-2 rounded cursor-pointer transition-colors select-none"
      classList={{
        "bg-blue-100 border-l-4 border-blue-500 font-semibold text-blue-700": isSelected(),
        "hover:bg-blue-100 text-gray-600": !isSelected(),
      }}
      draggable={true}
      onDragStart={(e) => props.onDragStart(e, props.chapter)}
      onDragOver={props.onDragOver}
      onDrop={(e) => props.onDrop(e, props.chapter)}
      onClick={() => chapterStore.selectChapter(props.chapter.id)}
    >
      <div class="flex items-center">
        <span class="mr-2 text-gray-400 cursor-grab">⋮⋮</span>
        {props.chapter.title}
      </div>
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
    <div class="p-4">
      <h2 class="text-xl font-semibold mb-3 text-gray-700">Chapters</h2>

      <Show when={chapterStore.loading()}>
        <p class="text-gray-500">Loading chapters...</p>
      </Show>

      <Show when={chapterStore.error()}>
        <p class="text-red-500">{chapterStore.error()}</p>
      </Show>

      <div class="space-y-2">
        <For each={chapterStore.chapters()}>
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

      <div class="mt-4">
        <Show
          when={isAdding()}
          fallback={
            <button
              onClick={() => setIsAdding(true)}
              class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors"
            >
              New Chapter
            </button>
          }
        >
          <input
            type="text"
            placeholder="New chapter title..."
            value={newChapterTitle()}
            onInput={(e) => setNewChapterTitle(e.currentTarget.value)}
            class="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <div class="flex space-x-2">
            <button
              onClick={handleAddChapter}
              class="flex-grow bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
            >
              Add
            </button>
            <button
              onClick={() => setIsAdding(false)}
              class="flex-grow bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
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
