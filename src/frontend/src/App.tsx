import type { Component } from "solid-js";
import { createSignal, onCleanup, onMount } from "solid-js";
import { DragDropProvider } from "@thisbeyond/solid-dnd";

// Using path aliases defined in tsconfig.json
import MainLayout from "@components/Layout/MainLayout";
import ChapterList from "@components/Chapters/ChapterList";
import EditorArea from "@components/Editor/EditorArea";
import IdeasSidebar from "@components/Ideas/IdeasSidebar";

const App: Component = () => {
  const [message, setMessage] = createSignal("Connecting to WebSocket...");
  // const [socket, setSocket] = createSignal<WebSocket | null>(null); // Keep if needed, or manage elsewhere

  onMount(() => {
    const ws = new WebSocket("ws://localhost:3001/ws"); // Connect to the backend WebSocket

    ws.onopen = () => {
      console.log("WebSocket connection established");
      setMessage("Connected to WebSocket!");
      ws.send("Hello from SolidJS client!");
    };

    ws.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      setMessage(`Received from server: ${event.data}`);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setMessage("WebSocket disconnected. Attempting to reconnect...");
      // Optional: implement reconnection logic here
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setMessage("WebSocket error. See console for details.");
    };

    // setSocket(ws); // Keep if needed

    onCleanup(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
  });

  return (
    <DragDropProvider>
      <div class="flex flex-col h-screen">
        <header class="bg-gray-800 text-white p-3 shadow-md z-10">
          <h1 class="text-xl font-semibold">TSWritter Clean</h1>
        </header>

        <div class="flex-grow overflow-hidden">
          {" "}
          {/* This div will contain the MainLayout and take remaining height */}
          <MainLayout
            chaptersPanel={<ChapterList />}
            editorPanel={<EditorArea />}
            ideasPanel={<IdeasSidebar />}
          />
        </div>

        {/* WebSocket Status Footer */}
        <footer class="p-2 bg-gray-700 text-white text-xs text-center">
          <p>WebSocket Status: {message()}</p>
        </footer>
      </div>
    </DragDropProvider>
  );
};

export default App;
