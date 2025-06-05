import type { Component } from "solid-js";
import { Show } from "solid-js";
import { uiStore } from "@stores/uiStore";
import { bookStore } from "@stores/bookStore";

const TopToolbar: Component = () => {
  return (
    <div class="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div class="flex items-center justify-between px-4 py-2">
        {/* Left side - App info and back button */}
        <div class="flex items-center space-x-3">
          <Show when={bookStore.selectedBook()}>
            <button
              onClick={() => bookStore.selectBook(null)}
              class="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200"
              title="Back to Books"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </Show>
          <div class="text-lg">📝</div>
          <h1 class="text-lg font-semibold tracking-tight text-gray-900">TSWritter</h1>
          <div class="text-xs text-gray-500 font-medium hidden sm:block">A Writer's Companion</div>
        </div>

        {/* Right side - Controls */}
        <div class="flex items-center gap-2">
          {/* Autosave Toggle */}
          <button
            onClick={uiStore.toggleAutoSave}
            class={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              uiStore.autoSaveEnabled()
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={uiStore.autoSaveEnabled() ? "Disable Autosave" : "Enable Autosave"}
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            <span class="hidden sm:inline">{uiStore.autoSaveEnabled() ? "Auto" : "Manual"}</span>
          </button>

          <div class="w-px h-4 bg-gray-300"></div>

          {/* Zen Mode Toggle */}
          <button
            onClick={uiStore.toggleZenMode}
            class={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              uiStore.isZenMode()
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={uiStore.isZenMode() ? "Exit Zen Mode" : "Enter Zen Mode"}
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span class="hidden sm:inline">{uiStore.isZenMode() ? "Exit Zen" : "Zen"}</span>
          </button>

          {/* Individual Toggle Buttons - Only show when not in zen mode */}
          <Show when={!uiStore.isZenMode()}>
            <>
              <div class="w-px h-4 bg-gray-300"></div>

              {/* Chapters Toggle */}
              <button
                onClick={uiStore.toggleChapters}
                class={`p-1.5 rounded-md transition-all duration-200 ${
                  uiStore.showChapters()
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
                title={uiStore.showChapters() ? "Hide Chapters" : "Show Chapters"}
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>

              {/* Ideas Toggle */}
              <button
                onClick={uiStore.toggleIdeas}
                class={`p-1.5 rounded-md transition-all duration-200 ${
                  uiStore.showIdeas()
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
                title={uiStore.showIdeas() ? "Hide Ideas" : "Show Ideas"}
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </button>
            </>
          </Show>
        </div>
      </div>
    </div>
  );
};

export default TopToolbar;
