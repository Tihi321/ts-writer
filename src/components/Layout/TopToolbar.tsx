import type { Component } from "solid-js";
import { Show, createSignal, createEffect, onCleanup } from "solid-js";
import { bookStore } from "@stores/bookStore";
import { settingsStore } from "@stores/settingsStore";
import { uiStore } from "@stores/uiStore";
import SyncStatusComponent from "../SyncStatus";
import { googleAuth } from "../../services/googleAuth";
import BookManagementModal from "../Book/BookManagementModal";
import { bookService } from "../../services/bookService";
import { chapterStore } from "@stores/chapterStore";

const TopToolbar: Component = () => {
  const [showBookManagement, setShowBookManagement] = createSignal(false);
  const [syncError, setSyncError] = createSignal<string | null>(null);
  const [syncSuccess, setSyncSuccess] = createSignal<string | null>(null);
  const [syncing, setSyncing] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  // Keyboard shortcuts for UI controls
  createEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when a book is selected and not in input fields
      if (
        !bookStore.selectedBook() ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "z":
            e.preventDefault();
            uiStore.toggleZenMode();
            break;
          case "c":
            e.preventDefault();
            uiStore.toggleChapters();
            break;
          case "i":
            e.preventDefault();
            uiStore.toggleIdeas();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  const handleSave = async () => {
    const chapter = chapterStore.selectedChapter();
    if (!chapter) return;

    setSaving(true);
    try {
      // For now, we'll trigger a save event that the EditorArea can listen to
      // This is a simple approach - in a more complex app, we'd use a shared state manager
      const saveEvent = new CustomEvent("triggerSave");
      window.dispatchEvent(saveEvent);

      setSyncSuccess("Save triggered!");
      setTimeout(() => setSyncSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to trigger save:", error);
      setSyncError("Failed to trigger save.");
      setTimeout(() => setSyncError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncBook = async (direction: "push" | "pull") => {
    const book = bookStore.selectedBook();
    if (!book) return;

    try {
      setSyncing(true);
      setSyncError(null);
      setSyncSuccess(null);

      if (book.source === "local" && direction === "push") {
        // For local books, use export to cloud
        await bookService.exportBookToCloud(book.id);
        setSyncSuccess(`"${book.name}" exported to cloud successfully!`);
      } else {
        // For cloud/imported books, use regular sync
        await bookService.syncBookWithCloud(book.id, direction);
        const action = direction === "push" ? "pushed to" : "pulled from";
        setSyncSuccess(`"${book.name}" ${action} cloud successfully!`);
      }

      // Refresh book data
      await bookStore.refetchBooks();

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSyncSuccess(null), 3000);
    } catch (err) {
      console.error("Sync error:", err);
      let errorMessage = "Failed to sync book";

      if (err instanceof Error) {
        if (err.message.includes("JSON")) {
          errorMessage = "Invalid data format in cloud. Please try again or contact support.";
        } else if (err.message.includes("not found")) {
          errorMessage = "Book not found in cloud. It may have been deleted.";
        } else if (err.message.includes("network") || err.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }

      setSyncError(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <div class="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div class="flex items-center justify-between px-4 py-2">
          {/* Left side - App info and back button */}
          <div class="flex items-center space-x-3">
            <Show when={bookStore.selectedBook()}>
              <button
                onClick={() => bookStore.clearSelection()}
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
            <h1 class="text-lg font-semibold tracking-tight text-gray-900">TSWriter</h1>
            <div class="text-xs text-gray-500 font-medium hidden sm:block">
              A Writer's Companion
            </div>

            {/* Book Management and Sync Buttons - Only show when a book is selected */}
            <Show when={bookStore.selectedBook()}>
              <div class="flex items-center space-x-1">
                {/* Current Book Name */}
                <span class="text-sm text-gray-600 font-medium hidden sm:inline">
                  {bookStore.selectedBook()?.name}
                </span>

                {/* Sync Status Indicator */}
                <Show when={bookStore.selectedBook()?.source !== "local"}>
                  <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {bookStore.selectedBook()?.syncStatus === "in_sync" ? "✅" : "⚠️"}
                  </span>
                </Show>

                {/* Sync Buttons - Only for cloud/imported books */}
                <Show
                  when={
                    bookStore.selectedBook()?.source !== "local" &&
                    settingsStore.settings.googleSyncEnabled &&
                    googleAuth.signedIn
                  }
                >
                  <button
                    onClick={() => handleSyncBook("pull")}
                    disabled={syncing()}
                    class="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200 disabled:opacity-50"
                    title="Pull from Cloud (overwrite local with cloud)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleSyncBook("push")}
                    disabled={syncing()}
                    class="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200 disabled:opacity-50"
                    title="Push to Cloud (overwrite cloud with local)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </button>
                </Show>

                {/* Export to Cloud Button - Only for local books */}
                <Show
                  when={
                    bookStore.selectedBook()?.source === "local" &&
                    settingsStore.settings.googleSyncEnabled &&
                    googleAuth.signedIn
                  }
                >
                  <button
                    onClick={() => handleSyncBook("push")}
                    disabled={syncing()}
                    class="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200 disabled:opacity-50"
                    title="Export to Cloud"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </button>
                </Show>

                <div class="w-px h-4 bg-gray-300"></div>

                <button
                  onClick={() => setShowBookManagement(true)}
                  class="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200"
                  title="Manage Books"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </button>
              </div>
            </Show>
          </div>

          {/* Right side - Controls */}
          <div class="flex items-center space-x-2">
            {/* Panel Toggles - Only show when a book is selected */}
            <Show when={bookStore.selectedBook()}>
              {/* Zen Mode Toggle */}
              <button
                onClick={() => uiStore.toggleZenMode()}
                class={`p-1.5 rounded-md transition-all duration-200 ${
                  uiStore.isZenMode()
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "hover:bg-gray-100 text-gray-600 hover:text-gray-800"
                }`}
                title={
                  uiStore.isZenMode()
                    ? "Exit Zen Mode (Ctrl+Shift+Z)"
                    : "Enter Zen Mode (Ctrl+Shift+Z)"
                }
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              </button>

              {/* Chapters Panel Toggle */}
              <button
                onClick={() => uiStore.toggleChapters()}
                class={`p-1.5 rounded-md transition-all duration-200 ${
                  uiStore.showChapters()
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                }`}
                title={
                  uiStore.showChapters()
                    ? "Hide Chapters Panel (Ctrl+Shift+C)"
                    : "Show Chapters Panel (Ctrl+Shift+C)"
                }
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </button>

              {/* Ideas Panel Toggle */}
              <button
                onClick={() => uiStore.toggleIdeas()}
                class={`p-1.5 rounded-md transition-all duration-200 ${
                  uiStore.showIdeas()
                    ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                }`}
                title={
                  uiStore.showIdeas()
                    ? "Hide Ideas Panel (Ctrl+Shift+I)"
                    : "Show Ideas Panel (Ctrl+Shift+I)"
                }
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </button>

              <div class="w-px h-4 bg-gray-300"></div>
            </Show>

            {/* Autosave Status and Save Button - Only show when a book is selected */}
            <Show when={bookStore.selectedBook()}>
              <Show when={settingsStore.settings.autoSave}>
                <span class="text-xs text-green-600 font-medium flex items-center space-x-1">
                  <span>✨</span>
                  <span class="hidden sm:inline">Autosave</span>
                </span>
              </Show>
              <Show when={!settingsStore.settings.autoSave}>
                <button
                  onClick={handleSave}
                  disabled={saving()}
                  class="text-xs bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-1.5 px-3 rounded transition-colors duration-200"
                  title="Save Chapter"
                >
                  {saving() ? "💾 Saving..." : "💾 Save"}
                </button>
              </Show>
              <div class="w-px h-4 bg-gray-300"></div>
            </Show>

            {/* Settings Button */}
            <button
              onClick={() => settingsStore.openSettings()}
              class="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-all duration-200"
              title="Settings"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            <div class="w-px h-4 bg-gray-300"></div>

            {/* Sync Status - Only show if Google sync is enabled */}
            <Show when={settingsStore.settings.googleSyncEnabled && googleAuth.signedIn}>
              <SyncStatusComponent />
              <div class="w-px h-4 bg-gray-300"></div>
            </Show>

            {/* User Info - Only show if signed in */}
            <Show
              when={
                settingsStore.settings.googleSyncEnabled &&
                googleAuth.signedIn &&
                googleAuth.currentUser
              }
            >
              <div class="flex items-center space-x-2">
                <img
                  src={googleAuth.currentUser!.picture}
                  alt={googleAuth.currentUser!.name}
                  class="w-6 h-6 rounded-full"
                  title={`Signed in as ${googleAuth.currentUser!.name}`}
                />
                <span class="text-xs text-gray-600 hidden sm:inline">
                  {googleAuth.currentUser!.name}
                </span>
              </div>
              <div class="w-px h-4 bg-gray-300"></div>
            </Show>
          </div>
        </div>
      </div>

      {/* Sync Error Toast */}
      <Show when={syncError()}>
        <div class="fixed top-16 right-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-md">
          <div class="flex items-center justify-between">
            <span class="text-sm">{syncError()}</span>
            <button onClick={() => setSyncError(null)} class="ml-2 text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        </div>
      </Show>

      {/* Sync Success Toast */}
      <Show when={syncSuccess()}>
        <div class="fixed top-16 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg max-w-md">
          <div class="flex items-center justify-between">
            <span class="text-sm">{syncSuccess()}</span>
            <button
              onClick={() => setSyncSuccess(null)}
              class="ml-2 text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        </div>
      </Show>

      {/* Book Management Modal */}
      <BookManagementModal
        isOpen={showBookManagement()}
        onClose={() => setShowBookManagement(false)}
      />
    </>
  );
};

export default TopToolbar;
