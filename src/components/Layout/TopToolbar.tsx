import type { Component } from "solid-js";
import { Show, createSignal, createEffect, onCleanup } from "solid-js";
import { bookStore } from "@stores/bookStore";
import { settingsStore } from "@stores/settingsStore";
import { uiStore } from "@stores/uiStore";
import { editorStore } from "@stores/editorStore";
import SyncStatusComponent from "../SyncStatus";
import { googleAuth } from "../../services/googleAuth";
import BookManagementModal from "../Book/BookManagementModal";
import { bookService } from "../../services/bookService";
import { chapterStore } from "@stores/chapterStore";
import "../../styles/themes.css";

const TopToolbar: Component = () => {
  const [showBookManagement, setShowBookManagement] = createSignal(false);
  const [syncError, setSyncError] = createSignal<string | null>(null);
  const [syncSuccess, setSyncSuccess] = createSignal<string | null>(null);
  const [syncing, setSyncing] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [isFullscreen, setIsFullscreen] = createSignal(false);

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  // Listen for fullscreen changes (including F11 key)
  createEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    onCleanup(() => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    });
  });

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
          case "f":
            e.preventDefault();
            toggleFullscreen();
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
      <div class="fixed top-0 left-0 right-0 z-40 theme-bg-secondary theme-border-primary border-b">
        <div class="flex items-center justify-between px-4 py-2">
          {/* Left side - App info and back button */}
          <div class="flex items-center space-x-3">
            <Show when={bookStore.selectedBook()}>
              <button
                onClick={() => bookStore.clearSelection()}
                class="p-1.5 theme-btn-secondary transition-all duration-200"
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
            <h1 class="text-lg font-semibold tracking-tight theme-text-primary">TSWriter</h1>
            <div class="text-xs theme-text-muted font-medium hidden sm:block">
              A Writer's Companion
            </div>

            {/* Book Management and Sync Buttons - Only show when a book is selected */}
            <Show when={bookStore.selectedBook()}>
              <div class="flex items-center space-x-1">
                {/* Current Book Name */}
                <span class="text-sm theme-text-tertiary font-medium hidden sm:inline">
                  {bookStore.selectedBook()?.name}
                </span>

                {/* Sync Status Indicator */}
                <Show when={bookStore.selectedBook()?.source !== "local"}>
                  <span class="text-xs px-2 py-1 theme-border-primary border theme-text-tertiary">
                    {bookStore.selectedBook()?.syncStatus === "in_sync" ? "✅" : "⚠️"}
                  </span>
                </Show>

                {/* Pull Button - Always show when book is selected */}
                <button
                  onClick={() => handleSyncBook("pull")}
                  disabled={
                    syncing() || !settingsStore.settings.googleSyncEnabled || !googleAuth.signedIn
                  }
                  class="p-1.5 theme-btn-secondary transition-all duration-200 disabled:opacity-50"
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

                {/* Push Button - Always show when book is selected */}
                <button
                  onClick={() => handleSyncBook("push")}
                  disabled={
                    syncing() || !settingsStore.settings.googleSyncEnabled || !googleAuth.signedIn
                  }
                  class="p-1.5 theme-btn-secondary transition-all duration-200 disabled:opacity-50"
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

                <div class="w-px h-4 theme-border-primary bg-current"></div>

                <button
                  onClick={() => setShowBookManagement(true)}
                  class="p-1.5 theme-btn-secondary transition-all duration-200"
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
                class={`p-1.5 border transition-all duration-200 ${
                  uiStore.isZenMode() ? "theme-btn-primary" : "theme-btn-secondary"
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
                class={`p-1.5 border transition-all duration-200 ${
                  uiStore.showChapters() ? "theme-btn-primary" : "theme-btn-secondary opacity-75"
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
                class={`p-1.5 border transition-all duration-200 ${
                  uiStore.showIdeas() ? "theme-btn-primary" : "theme-btn-secondary opacity-75"
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

              <div class="w-px h-4 theme-border-primary bg-current"></div>

              {/* Editor Controls - Text Size and Mode */}
              <div class="flex items-center space-x-2">
                {/* Text Size */}
                <div class="flex items-center space-x-1">
                  <span class="theme-text-tertiary text-xs font-medium">Size:</span>
                  <button
                    onClick={() => editorStore.setTextSize(50)}
                    class={`px-2 py-1 text-xs border transition-all duration-200 ${
                      editorStore.textSize() === 50 ? "theme-btn-primary" : "theme-btn-secondary"
                    }`}
                    title="Small (50%)"
                  >
                    S
                  </button>
                  <button
                    onClick={() => editorStore.setTextSize(75)}
                    class={`px-2 py-1 text-xs border transition-all duration-200 ${
                      editorStore.textSize() === 75 ? "theme-btn-primary" : "theme-btn-secondary"
                    }`}
                    title="Medium (75%)"
                  >
                    M
                  </button>
                  <button
                    onClick={() => editorStore.setTextSize(100)}
                    class={`px-2 py-1 text-xs border transition-all duration-200 ${
                      editorStore.textSize() === 100 ? "theme-btn-primary" : "theme-btn-secondary"
                    }`}
                    title="Large (100%)"
                  >
                    L
                  </button>
                </div>

                {/* Editor Mode Toggle */}
                <button
                  onClick={() => editorStore.toggleMode()}
                  class="flex items-center px-3 py-1.5 text-xs font-medium border theme-btn-secondary transition-all duration-200"
                  title={
                    editorStore.mode() === "write" ? "Switch to Code View" : "Switch to Write View"
                  }
                >
                  {editorStore.mode() === "write" ? <>&lt;/&gt; Code</> : <>✏️ Write</>}
                </button>
              </div>

              <div class="w-px h-4 theme-border-primary bg-current"></div>
            </Show>

            {/* Autosave Status and Save Button - Only show when a book is selected */}
            <Show when={bookStore.selectedBook()}>
              <Show when={settingsStore.settings.autoSave}>
                <span class="text-xs theme-text-tertiary font-medium flex items-center space-x-1 theme-border-primary border px-2 py-1">
                  <span>✨</span>
                  <span class="hidden sm:inline">Autosave</span>
                </span>
              </Show>
              <Show when={!settingsStore.settings.autoSave}>
                <button
                  onClick={handleSave}
                  disabled={saving()}
                  class="text-xs theme-btn-primary font-medium py-1.5 px-3 transition-colors duration-200 disabled:opacity-50"
                  title="Save Chapter"
                >
                  {saving() ? "💾 Saving..." : "💾 Save"}
                </button>
              </Show>
              <div class="w-px h-4 theme-border-primary bg-current"></div>
            </Show>

            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              class={`p-1.5 border transition-all duration-200 ${
                isFullscreen() ? "theme-btn-primary" : "theme-btn-secondary"
              }`}
              title={
                isFullscreen()
                  ? "Exit Fullscreen (Ctrl+Shift+F)"
                  : "Enter Fullscreen (Ctrl+Shift+F)"
              }
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <Show when={!isFullscreen()}>
                  {/* Expand/Enter Fullscreen Icon */}
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </Show>
                <Show when={isFullscreen()}>
                  {/* Compress/Exit Fullscreen Icon */}
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5"
                  />
                </Show>
              </svg>
            </button>

            <div class="w-px h-4 theme-border-primary bg-current"></div>

            {/* Settings Button */}
            <button
              onClick={() => settingsStore.openSettings()}
              class="p-1.5 theme-btn-secondary transition-all duration-200"
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

            <div class="w-px h-4 theme-border-primary bg-current"></div>

            {/* Sync Status - Only show if Google sync is enabled */}
            <Show when={settingsStore.settings.googleSyncEnabled && googleAuth.signedIn}>
              <SyncStatusComponent />
              <div class="w-px h-4 theme-border-primary bg-current"></div>
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
                  class="w-6 h-6 rounded-full theme-border-primary border"
                  title={`Signed in as ${googleAuth.currentUser!.name}`}
                />
                <span class="text-xs theme-text-tertiary hidden sm:inline">
                  {googleAuth.currentUser!.name}
                </span>
              </div>
              <div class="w-px h-4 theme-border-primary bg-current"></div>
            </Show>
          </div>
        </div>
      </div>

      {/* Sync Error Toast */}
      <Show when={syncError()}>
        <div class="fixed top-16 right-4 z-50 theme-alert theme-shadow-medium max-w-md">
          <div class="flex items-center justify-between">
            <span class="text-sm">{syncError()}</span>
            <button
              onClick={() => setSyncError(null)}
              class="ml-2 theme-text-muted hover:theme-text-secondary"
            >
              ×
            </button>
          </div>
        </div>
      </Show>

      {/* Sync Success Toast */}
      <Show when={syncSuccess()}>
        <div class="fixed top-16 right-4 z-50 theme-alert theme-shadow-medium max-w-md">
          <div class="flex items-center justify-between">
            <span class="text-sm">{syncSuccess()}</span>
            <button
              onClick={() => setSyncSuccess(null)}
              class="ml-2 theme-text-muted hover:theme-text-secondary"
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
