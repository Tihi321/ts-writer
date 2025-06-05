import type { Component, JSX } from "solid-js";

interface MainLayoutProps {
  chaptersPanel: JSX.Element;
  editorPanel: JSX.Element;
  ideasPanel: JSX.Element;
}

const MainLayout: Component<MainLayoutProps> = (props) => {
  return (
    <div class="flex h-screen bg-gray-100">
      {/* Chapters Panel (Left) */}
      <aside class="w-1/4 bg-gray-50 p-4 border-r border-gray-300 overflow-y-auto">
        {props.chaptersPanel}
      </aside>

      {/* Editor Panel (Center) */}
      <main class="flex-1 p-4 flex flex-col overflow-y-auto">{props.editorPanel}</main>

      {/* Ideas Panel (Right) */}
      <aside class="w-1/4 bg-gray-50 p-4 border-l border-gray-300 overflow-y-auto">
        {props.ideasPanel}
      </aside>
    </div>
  );
};

export default MainLayout;
