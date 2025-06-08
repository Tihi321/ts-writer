import type { Component, JSX } from "solid-js";
import { Show } from "solid-js";
import { uiStore } from "@stores/uiStore";

interface MainLayoutProps {
  chaptersPanel: JSX.Element;
  editorPanel: JSX.Element;
  ideasPanel: JSX.Element;
}

const MainLayout: Component<MainLayoutProps> = (props) => {
  return (
    <div class="flex h-full transition-all duration-300 bg-white">
      {/* Chapters Panel (Left) */}
      <Show when={uiStore.showChapters()}>
        <aside class="w-1/4 p-4 border-r border-gray-300 overflow-y-auto transition-all duration-300">
          {props.chaptersPanel}
        </aside>
      </Show>

      {/* Editor Panel (Center) */}
      <main
        class={`flex-1 p-4 flex flex-col overflow-y-auto transition-all duration-300 ${
          uiStore.isZenMode() ? "px-8 py-6" : ""
        }`}
      >
        {props.editorPanel}
      </main>

      {/* Ideas Panel (Right) */}
      <Show when={uiStore.showIdeas()}>
        <aside class="w-1/4 p-4 border-l border-gray-300 overflow-y-auto transition-all duration-300">
          {props.ideasPanel}
        </aside>
      </Show>
    </div>
  );
};

export default MainLayout;
