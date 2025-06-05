import { Component, createEffect, createSignal, For, Show } from "solid-js";
import { chapterStore } from "../../stores/chapterStore";
import { ideaStore, setIdeaStore } from "../../stores/ideaStore";
import { ideaService } from "../../services/ideaService";
import { Idea } from "../../stores/types";
import {
  SortableProvider,
  DragOverlay,
  createSortable,
  useDragDropContext,
  DragEvent,
} from "@thisbeyond/solid-dnd";

const SortableIdea = (props: { idea: Idea; onDelete: (id: string) => void }) => {
  const sortable = createSortable(props.idea.id);
  const [isEditing, setIsEditing] = createSignal(false);
  const [editText, setEditText] = createSignal(props.idea.text);
  let textareaRef: HTMLTextAreaElement | undefined;

  const handleSave = async () => {
    if (!isEditing()) return;

    const trimmedText = editText().trim();
    if (trimmedText && trimmedText !== props.idea.text) {
      try {
        const chapterId = chapterStore.selectedChapterId!;
        // Optimistically update store
        setIdeaStore("ideas", (idea) => idea.id === props.idea.id, "text", trimmedText);
        setIsEditing(false); // Exit editing mode immediately

        await ideaService.updateIdea(chapterId, props.idea.id, { text: trimmedText });
      } catch (error) {
        alert("Failed to update idea.");
        // Revert on error
        setIdeaStore("ideas", (idea) => idea.id === props.idea.id, "text", props.idea.text);
      }
    } else {
      setIsEditing(false); // Exit editing mode if no change
    }
  };

  createEffect(() => {
    if (isEditing()) {
      textareaRef?.focus();
    }
  });

  return (
    <div
      ref={sortable.ref}
      class="p-3 bg-yellow-100 border border-yellow-200 rounded-md shadow-sm select-none"
      style={{
        transform: `translateY(${sortable.transform?.y || 0}px)`,
        transition: "transform 0.2s",
      }}
      classList={{ "opacity-25": sortable.isActiveDraggable }}
    >
      <Show
        when={!isEditing()}
        fallback={
          <textarea
            ref={textareaRef}
            class="w-full p-1 text-sm bg-yellow-50 border border-yellow-300 rounded focus:ring-1 focus:ring-yellow-500"
            value={editText()}
            onInput={(e: Event) => setEditText((e.currentTarget as HTMLTextAreaElement).value)}
            onBlur={handleSave}
          />
        }
      >
        <p class="text-sm text-yellow-800">{props.idea.text}</p>
      </Show>
      <div class="mt-1 text-right space-x-2">
        <Show
          when={isEditing()}
          fallback={
            <button
              onClick={() => setIsEditing(true)}
              class="text-xs text-yellow-600 hover:text-yellow-800"
            >
              Edit
            </button>
          }
        >
          <button
            onClick={handleSave}
            class="text-xs text-green-600 hover:text-green-800 font-semibold"
          >
            Save
          </button>
        </Show>
        <button
          onClick={() => props.onDelete(props.idea.id)}
          class="text-xs text-red-500 hover:text-red-700"
        >
          Del
        </button>
      </div>
    </div>
  );
};

const IdeasSidebar: Component = () => {
  const [newIdeaText, setNewIdeaText] = createSignal("");
  const [state, { onDragEnd }] = useDragDropContext()!;

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

  const fetchIdeas = async (chapterId: string) => {
    setIdeaStore("isLoading", true);
    try {
      const ideas = await ideaService.getIdeasForChapter(chapterId);
      setIdeaStore("ideas", ideas);
    } catch (error) {
      setIdeaStore("error", "Failed to load ideas.");
    } finally {
      setIdeaStore("isLoading", false);
    }
  };

  const ideaIds = () => ideaStore.ideas.map((idea) => idea.id);

  onDragEnd(({ draggable, droppable }: DragEvent) => {
    if (draggable && droppable && draggable.id !== droppable.id) {
      const chapterId = chapterStore.selectedChapterId;
      if (!chapterId) return;

      const fromIndex = ideaIds().indexOf(draggable.id as string);
      const toIndex = ideaIds().indexOf(droppable.id as string);
      const currentIdeas = [...ideaStore.ideas];
      const [moved] = currentIdeas.splice(fromIndex, 1);
      currentIdeas.splice(toIndex, 0, moved);

      setIdeaStore("ideas", currentIdeas);

      ideaService
        .reorderIdeas(
          chapterId,
          currentIdeas.map((i) => i.id)
        )
        .catch(() => {
          alert("Failed to save new idea order. Reverting.");
          fetchIdeas(chapterId); // Revert on failure
        });
    }
  });

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

        <SortableProvider ids={ideaIds()}>
          <div class="space-y-2 mb-4">
            <For
              each={ideaStore.ideas}
              fallback={<p class="text-sm text-gray-400">No ideas for this chapter yet.</p>}
            >
              {(idea: Idea) => <SortableIdea idea={idea} onDelete={handleDeleteIdea} />}
            </For>
          </div>
        </SortableProvider>

        <DragOverlay>
          <div class="p-3 bg-yellow-200 border rounded-md shadow-xl">Dragging...</div>
        </DragOverlay>

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
