import { Component, createSignal, For, onMount, Show, createEffect, onCleanup } from "solid-js";
import { chapterStore, setChapterStore } from "../../stores/chapterStore";
import { chapterService } from "../../services/chapterService";
import { Chapter } from "../../stores/types";
import {
  DragDropProvider,
  DragDropSensors,
  DragOverlay,
  SortableProvider,
  createSortable,
  useDragDropContext,
} from "@thisbeyond/solid-dnd";

const SortableChapter = (props: { chapter: Chapter; onSelect: (id: string) => void }) => {
  const sortable = createSortable(props.chapter.id);
  const isSelected = () => props.chapter.id === chapterStore.selectedChapterId;
  const [isRenaming, setIsRenaming] = createSignal(false);
  const [renameText, setRenameText] = createSignal(props.chapter.title);
  let renameInputRef: HTMLInputElement | undefined;

  const handleRename = async () => {
    if (!isRenaming()) return;
    setIsRenaming(false);
    if (renameText().trim() && renameText() !== props.chapter.title) {
      try {
        // Optimistically update the store
        const oldTitle = props.chapter.title;
        setChapterStore("chapters", (ch) => ch.id === props.chapter.id, "title", renameText());

        await chapterService.updateChapter(props.chapter.id, { title: renameText() });
      } catch (error) {
        alert("Failed to rename chapter.");
        // Revert if error
        setChapterStore(
          "chapters",
          (ch) => ch.id === props.chapter.id,
          "title",
          props.chapter.title
        );
      }
    }
  };

  createEffect(() => {
    if (isRenaming()) {
      renameInputRef?.focus();
      renameInputRef?.select();
    }
  });

  return (
    <div
      ref={sortable.ref}
      class="p-2 rounded cursor-pointer transition-colors select-none"
      classList={{
        "bg-blue-100 border-l-4 border-blue-500 font-semibold text-blue-700": isSelected(),
        "hover:bg-blue-100 text-gray-600": !isSelected(),
        "opacity-25": sortable.isActiveDraggable,
      }}
      style={{
        transform: `translateY(${sortable.transform?.y || 0}px)`,
        transition: "transform 0.2s",
      }}
      onClick={() => props.onSelect(props.chapter.id)}
      onDblClick={() => setIsRenaming(true)}
    >
      <Show
        when={!isRenaming()}
        fallback={
          <input
            ref={renameInputRef}
            type="text"
            value={renameText()}
            onInput={(e) => setRenameText(e.currentTarget.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            class="w-full bg-transparent p-0 m-0 border-0 focus:ring-0"
          />
        }
      >
        {props.chapter.title}
      </Show>
    </div>
  );
};

const ChapterList: Component = () => {
  const [isAdding, setIsAdding] = createSignal(false);
  const [newChapterTitle, setNewChapterTitle] = createSignal("");
  const [state, { onDragEnd }] = useDragDropContext()!;

  // Local signal for chapter order
  const [chapterIds, setChapterIds] = createSignal<string[]>([]);
  createEffect(() => {
    setChapterIds(chapterStore.chapters.map((ch) => ch.id));
  });

  const fetchChapters = async () => {
    setChapterStore("isLoading", true);
    try {
      const chapters = await chapterService.getAllChapters();
      setChapterStore("chapters", chapters);
      // Automatically select the first chapter if one exists and none is selected
      if (chapters.length > 0 && !chapterStore.selectedChapterId) {
        handleSelectChapter(chapters[0].id);
      }
    } catch (error) {
      setChapterStore("error", "Failed to load chapters.");
      console.error(error);
    } finally {
      setChapterStore("isLoading", false);
    }
  };

  const handleSelectChapter = async (chapterId: string) => {
    setChapterStore("selectedChapterId", chapterId);
    setChapterStore("isLoading", true);
    try {
      const chapterWithContent = await chapterService.getChapterById(chapterId);
      setChapterStore("selectedChapterContent", chapterWithContent.content);
    } catch (error) {
      setChapterStore("error", "Failed to load chapter content.");
      console.error(error);
    } finally {
      setChapterStore("isLoading", false);
    }
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle().trim()) {
      alert("Chapter title cannot be empty.");
      return;
    }
    try {
      await chapterService.createChapter(newChapterTitle());
      setNewChapterTitle("");
      setIsAdding(false);
      await fetchChapters(); // Refresh the list
    } catch (error) {
      alert("Failed to create chapter.");
      console.error(error);
    }
  };

  onMount(fetchChapters);

  onDragEnd(({ draggable, droppable }) => {
    if (draggable && droppable) {
      const currentItems = chapterIds();
      const fromIndex = currentItems.indexOf(draggable.id as string);
      const toIndex = currentItems.indexOf(droppable.id as string);
      if (fromIndex !== toIndex) {
        const [moved] = currentItems.splice(fromIndex, 1);
        currentItems.splice(toIndex, 0, moved);

        const newOrder = currentItems.map(
          (id) => chapterStore.chapters.find((ch) => ch.id === id)!
        );
        setChapterStore("chapters", newOrder); // Optimistic UI update
        setChapterIds([...currentItems]); // Update local order signal

        // Persist change to backend
        chapterService.reorderChapters(currentItems).catch((e) => {
          console.error("Failed to save order", e);
          alert("Failed to save new chapter order. Reverting.");
          fetchChapters(); // Revert on failure
        });
      }
    }
  });

  return (
    <div>
      <h2 class="text-xl font-semibold mb-3 text-gray-700">Chapters</h2>

      <Show when={chapterStore.isLoading && chapterStore.chapters.length === 0}>
        <p class="text-gray-500">Loading chapters...</p>
      </Show>

      <Show when={chapterStore.error}>
        <p class="text-red-500">{chapterStore.error}</p>
      </Show>

      <SortableProvider ids={chapterIds()}>
        <div class="space-y-2">
          <For each={chapterStore.chapters}>
            {(chapter) => <SortableChapter chapter={chapter} onSelect={handleSelectChapter} />}
          </For>
        </div>
      </SortableProvider>

      <DragOverlay>
        <div class="p-2 rounded bg-blue-200 shadow-lg">
          {useDragDropContext()![0].active.draggable?.id}
        </div>
      </DragOverlay>

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
