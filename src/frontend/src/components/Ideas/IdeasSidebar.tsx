import { Component, createSignal, For, Show } from "solid-js";
import { chapterStore } from "../../stores/chapterStore";
import { ideaStore } from "../../stores/ideaStore";
import { Idea } from "../../stores/types";

const IdeaItem: Component<{ idea: Idea }> = (props) => {
  // Simplified view, can add edit/delete functionality back as needed
  return (
    <div class="p-3 bg-yellow-100 border border-yellow-200 rounded-md shadow-sm">
      <p class="text-sm text-yellow-800">{props.idea.text}</p>
    </div>
  );
};

const IdeasSidebar: Component = () => {
  const [newIdeaText, setNewIdeaText] = createSignal("");

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
            {(idea: Idea) => <IdeaItem idea={idea} />}
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
