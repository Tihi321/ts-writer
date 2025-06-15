import { Component, Show, createSignal, onMount } from "solid-js";
import { settingsStore } from "../stores/settingsStore";
import { googleAuth } from "../services/googleAuth";
import { indexedDBService } from "../services/indexedDB";
import { uiStore } from "../stores/uiStore";
import { getTheme, setTheme, toggleTheme, type Theme } from "../utils/theme";
import "../styles/themes.css";
import { editorStore } from "../stores/editorStore";

const SettingsModal: Component = () => {
  const [isSigningIn, setIsSigningIn] = createSignal(false);
  const [authError, setAuthError] = createSignal<string | null>(null);
  const [googleClientId, setGoogleClientId] = createSignal("");
  const [googleApiKey, setGoogleApiKey] = createSignal("");
  const [isClearing, setIsClearing] = createSignal(false);
  const [activeTab, setActiveTab] = createSignal<"sync" | "editor" | "general" | "api">("sync");
  const [currentTheme, setCurrentTheme] = createSignal<Theme>(getTheme());

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setAuthError(null);
      await googleAuth.signIn();
      settingsStore.enableGoogleSync();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      setAuthError(null);
      await googleAuth.signOut();
      settingsStore.disableGoogleSync();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Failed to sign out");
    }
  };

  const handleCloseModal = () => {
    settingsStore.closeSettings();
  };

  const handleThemeToggle = () => {
    const newTheme = toggleTheme();
    setCurrentTheme(newTheme);
  };

  // Load API keys on mount
  onMount(async () => {
    try {
      // Ensure IndexedDB is initialized first
      await indexedDBService.initialize();

      const clientId = await indexedDBService.getGoogleClientId();
      const apiKey = await indexedDBService.getGoogleApiKey();

      if (clientId) setGoogleClientId(clientId);
      if (apiKey) setGoogleApiKey(apiKey);
    } catch (error) {
      console.error("Failed to load API keys:", error);
    }
  });

  const handleSaveApiKeys = async () => {
    try {
      // Ensure IndexedDB is initialized first
      await indexedDBService.initialize();

      if (googleClientId().trim()) {
        await indexedDBService.setGoogleClientId(googleClientId().trim());
      }
      if (googleApiKey().trim()) {
        await indexedDBService.setGoogleApiKey(googleApiKey().trim());
      }
      alert("API keys saved successfully!");
    } catch (error) {
      console.error("Failed to save API keys:", error);
      alert("Failed to save API keys.");
    }
  };

  const handleClearBooks = async () => {
    if (
      !confirm("Are you sure you want to delete all books and chapters? This cannot be undone.")
    ) {
      return;
    }

    setIsClearing(true);
    try {
      // Ensure IndexedDB is initialized first
      await indexedDBService.initialize();
      await indexedDBService.clearAllBooks();
      alert("All books and chapters have been deleted.");
      // Refresh the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear books:", error);
      alert("Failed to clear books.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearConfig = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all configuration including API keys? This cannot be undone."
      )
    ) {
      return;
    }

    setIsClearing(true);
    try {
      // Ensure IndexedDB is initialized first
      await indexedDBService.initialize();
      await indexedDBService.clearAllConfig();
      setGoogleClientId("");
      setGoogleApiKey("");
      alert("All configuration has been cleared.");
    } catch (error) {
      console.error("Failed to clear config:", error);
      alert("Failed to clear configuration.");
    } finally {
      setIsClearing(false);
    }
  };

  const TabButton: Component<{
    id: "sync" | "editor" | "general" | "api";
    label: string;
    icon: string;
  }> = (props) => (
    <button
      onClick={() => setActiveTab(props.id)}
      class={`flex items-center space-x-2 px-4 py-2 border transition-colors ${
        activeTab() === props.id ? "theme-btn-primary" : "theme-btn-secondary"
      }`}
    >
      <span class="text-lg">{props.icon}</span>
      <span class="font-medium">{props.label}</span>
    </button>
  );

  return (
    <Show when={settingsStore.showSettings}>
      <div class="fixed inset-0 z-50">
        <div class="theme-bg-secondary w-full h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div class="flex items-center justify-between p-6 theme-border-secondary border-b">
            <h2 class="text-2xl font-bold theme-text-primary">Settings</h2>
            <button
              onClick={handleCloseModal}
              class="theme-text-muted hover:theme-text-tertiary transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div class="flex theme-border-secondary border-b px-6 pt-4">
            <div class="flex space-x-2">
              <TabButton id="sync" label="Sync & Cloud" icon="☁️" />
              <TabButton id="editor" label="Editor" icon="✏️" />
              <TabButton id="general" label="General" icon="⚙️" />
              <TabButton id="api" label="API Keys" icon="🔑" />
            </div>
          </div>

          {/* Content */}
          <div class="flex-1 overflow-y-auto p-6">
            {/* Sync & Cloud Tab */}
            <Show when={activeTab() === "sync"}>
              <div class="space-y-8">
                {/* Google Drive Connection */}
                <div class="space-y-4">
                  <h3 class="text-lg font-semibold theme-text-primary flex items-center">
                    <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google Drive Connection
                  </h3>

                  <Show when={authError()}>
                    <div class="theme-alert">
                      <p class="theme-text-primary text-sm">{authError()}</p>
                    </div>
                  </Show>

                  <Show when={!googleAuth.signedIn}>
                    <div class="theme-card p-4">
                      <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                          <svg
                            class="w-6 h-6 theme-text-tertiary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div class="flex-1">
                          <h4 class="text-sm font-medium theme-text-primary">
                            Connect to Google Drive
                          </h4>
                          <p class="text-sm theme-text-secondary mt-1">
                            Connect your Google account to sync your writing projects across devices
                            and backup to Google Drive.
                          </p>
                          <ul class="text-xs theme-text-tertiary mt-2 space-y-1">
                            <li>• Automatic backup to Google Drive</li>
                            <li>• Sync across multiple devices</li>
                            <li>• Access your work anywhere</li>
                            <li>• Never lose your writing</li>
                          </ul>
                        </div>
                      </div>
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={isSigningIn()}
                        class="mt-4 w-full theme-btn-primary font-medium py-2 px-4 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                      >
                        <Show when={isSigningIn()}>
                          <div class="animate-spin rounded-full h-4 w-4 border-b-2 theme-spinner mr-2"></div>
                        </Show>
                        <Show when={!isSigningIn()}>
                          <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                        </Show>
                        {isSigningIn() ? "Connecting..." : "Connect Google Account"}
                      </button>
                    </div>
                  </Show>

                  <Show when={googleAuth.signedIn && googleAuth.currentUser}>
                    <div class="theme-card p-4">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                          <img
                            src={googleAuth.currentUser!.picture}
                            alt={googleAuth.currentUser!.name}
                            class="w-10 h-10"
                          />
                          <div>
                            <h4 class="text-sm font-medium theme-text-primary">
                              {googleAuth.currentUser!.name}
                            </h4>
                            <p class="text-sm theme-text-secondary">
                              {googleAuth.currentUser!.email}
                            </p>
                            <p class="text-xs theme-text-tertiary">✓ Connected to Google Drive</p>
                          </div>
                        </div>
                        <button
                          onClick={handleGoogleSignOut}
                          class="text-sm theme-text-secondary hover:theme-text-primary underline"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  </Show>
                </div>

                {/* Sync Settings */}
                <Show when={googleAuth.signedIn}>
                  <div class="space-y-4 theme-border-secondary border-t pt-6">
                    <h3 class="text-lg font-semibold theme-text-primary">Sync Settings</h3>

                    <div class="space-y-4">
                      <label class="flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium theme-text-secondary">Auto sign-in</span>
                          <span class="text-xs theme-text-muted">
                            Automatically sign in to Google Drive on app start
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            settingsStore.updateSetting(
                              "autoSignIn",
                              !settingsStore.settings.autoSignIn
                            )
                          }
                          class={`relative inline-flex h-6 w-11 items-center border transition-colors ${
                            settingsStore.settings.autoSignIn
                              ? "theme-border-focus"
                              : "theme-border-primary"
                          }`}
                        >
                          <span
                            class={`inline-block h-4 w-4 transform theme-border-hover border transition-transform ${
                              settingsStore.settings.autoSignIn ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </label>

                      <label class="flex items-center justify-between">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium theme-text-secondary">
                            Auto-sync with cloud
                          </span>
                          <span class="text-xs theme-text-muted">
                            Automatically sync changes to Google Drive
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            settingsStore.updateSetting(
                              "autoSyncEnabled",
                              !settingsStore.settings.autoSyncEnabled
                            )
                          }
                          class={`relative inline-flex h-6 w-11 items-center border transition-colors ${
                            settingsStore.settings.autoSyncEnabled
                              ? "theme-border-focus"
                              : "theme-border-primary"
                          }`}
                        >
                          <span
                            class={`inline-block h-4 w-4 transform theme-border-hover border transition-transform ${
                              settingsStore.settings.autoSyncEnabled
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </label>

                      <Show when={settingsStore.settings.autoSyncEnabled}>
                        <label class="flex items-center justify-between">
                          <span class="text-sm font-medium theme-text-secondary">
                            Auto-sync interval
                          </span>
                          <select
                            value={settingsStore.settings.autoSyncInterval}
                            onChange={(e) =>
                              settingsStore.updateSetting(
                                "autoSyncInterval",
                                parseInt(e.currentTarget.value)
                              )
                            }
                            class="text-sm theme-input px-2 py-1"
                          >
                            <option value={1}>1 minute</option>
                            <option value={5}>5 minutes</option>
                            <option value={10}>10 minutes</option>
                            <option value={30}>30 minutes</option>
                          </select>
                        </label>
                      </Show>
                    </div>
                  </div>
                </Show>

                {/* Offline Mode */}
                <div class="space-y-4 theme-border-secondary border-t pt-6">
                  <h3 class="text-lg font-semibold theme-text-primary flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Local Storage
                  </h3>

                  <div class="theme-card p-4">
                    <div class="flex items-start space-x-3">
                      <div class="flex-shrink-0">
                        <svg
                          class="w-6 h-6 theme-text-tertiary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <h4 class="text-sm font-medium theme-text-primary">Works Offline</h4>
                        <p class="text-sm theme-text-tertiary mt-1">
                          Your writing is automatically saved to your browser's local storage. You
                          can write even without an internet connection.
                        </p>
                      </div>
                    </div>
                  </div>

                  <label class="flex items-center justify-between">
                    <span class="text-sm font-medium theme-text-secondary">Offline-only mode</span>
                    <button
                      onClick={() => settingsStore.toggleOfflineMode()}
                      class={`relative inline-flex h-6 w-11 items-center border transition-colors ${
                        settingsStore.settings.offlineMode
                          ? "theme-border-focus"
                          : "theme-border-primary"
                      }`}
                    >
                      <span
                        class={`inline-block h-4 w-4 transform theme-border-hover border transition-transform ${
                          settingsStore.settings.offlineMode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </Show>

            {/* Editor Tab */}
            <Show when={activeTab() === "editor"}>
              <div class="space-y-8">
                {/* Auto-save Section */}
                <div class="space-y-4">
                  <h3 class="text-lg font-semibold theme-text-primary flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                      />
                    </svg>
                    Auto-save
                  </h3>

                  <label class="flex items-center justify-between">
                    <span class="text-sm font-medium theme-text-secondary">Enable auto-save</span>
                    <button
                      onClick={() =>
                        settingsStore.updateSetting("autoSave", !settingsStore.settings.autoSave)
                      }
                      class={`relative inline-flex h-6 w-11 items-center border transition-colors ${
                        settingsStore.settings.autoSave
                          ? "theme-border-focus"
                          : "theme-border-primary"
                      }`}
                    >
                      <span
                        class={`inline-block h-4 w-4 transform theme-border-hover border transition-transform ${
                          settingsStore.settings.autoSave ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>

                  <Show when={settingsStore.settings.autoSave}>
                    <label class="flex items-center justify-between">
                      <span class="text-sm font-medium theme-text-secondary">
                        Auto-save interval
                      </span>
                      <select
                        value={settingsStore.settings.autoSaveInterval}
                        onChange={(e) =>
                          settingsStore.updateSetting(
                            "autoSaveInterval",
                            parseInt(e.currentTarget.value)
                          )
                        }
                        class="text-sm theme-input px-2 py-1"
                      >
                        <option value={10}>10 seconds</option>
                        <option value={30}>30 seconds</option>
                        <option value={60}>1 minute</option>
                        <option value={300}>5 minutes</option>
                      </select>
                    </label>
                  </Show>
                </div>

                {/* Zen Mode */}
                <div class="space-y-4 theme-border-secondary border-t pt-6">
                  <h3 class="text-lg font-semibold theme-text-primary">Writing Experience</h3>

                  <label class="flex items-center justify-between">
                    <div class="flex flex-col">
                      <span class="text-sm font-medium theme-text-secondary">Zen Mode</span>
                      <span class="text-xs theme-text-muted">
                        Hide all panels for distraction-free writing
                      </span>
                    </div>
                    <button
                      onClick={() => uiStore.toggleZenMode()}
                      class={`relative inline-flex h-6 w-11 items-center border transition-colors ${
                        uiStore.isZenMode() ? "theme-border-focus" : "theme-border-primary"
                      }`}
                    >
                      <span
                        class={`inline-block h-4 w-4 transform theme-border-hover border transition-transform ${
                          uiStore.isZenMode() ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>

                  {/* Editor Width */}
                  <div class="space-y-2">
                    <label class="text-sm font-medium theme-text-secondary">Editor Width</label>
                    <div class="flex items-center space-x-2">
                      <button
                        onClick={() => editorStore.setTextSize(50)}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.textSize() === 50
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="Narrow (50%)"
                      >
                        Narrow
                      </button>
                      <button
                        onClick={() => editorStore.setTextSize(75)}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.textSize() === 75
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="Medium (75%)"
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => editorStore.setTextSize(100)}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.textSize() === 100
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="Full (100%)"
                      >
                        Full
                      </button>
                    </div>
                    <div class="text-xs theme-text-muted mt-1">
                      Controls the width of the editor area (not the text size).
                    </div>
                  </div>

                  {/* Font Size */}
                  <div class="space-y-2">
                    <label class="text-sm font-medium theme-text-secondary">Font Size</label>
                    <div class="flex items-center space-x-2">
                      <button
                        onClick={() => editorStore.setFontSize(14)}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.fontSize() === 14
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="Small (14px)"
                      >
                        Small
                      </button>
                      <button
                        onClick={() => editorStore.setFontSize(16)}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.fontSize() === 16
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="Medium (16px)"
                      >
                        Medium
                      </button>
                      <button
                        onClick={() => editorStore.setFontSize(18)}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.fontSize() === 18
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="Large (18px)"
                      >
                        Large
                      </button>
                    </div>
                    <div class="text-xs theme-text-muted mt-1">
                      Controls the font size in the editor area.
                    </div>
                  </div>

                  {/* Paragraph Padding */}
                  <div class="space-y-2">
                    <label class="text-sm font-medium theme-text-secondary">
                      Paragraph Padding
                    </label>
                    <div class="flex items-center space-x-2">
                      <button
                        onClick={() => editorStore.setPaddingSize("0.5em")}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.paddingSize() === "0.5em"
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="0.5em"
                      >
                        0.5em
                      </button>
                      <button
                        onClick={() => editorStore.setPaddingSize("1em")}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.paddingSize() === "1em"
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="1em"
                      >
                        1em
                      </button>
                      <button
                        onClick={() => editorStore.setPaddingSize("1.5em")}
                        class={`px-2 py-1 text-xs border transition-all duration-200 ${
                          editorStore.paddingSize() === "1.5em"
                            ? "theme-btn-primary"
                            : "theme-btn-secondary"
                        }`}
                        title="1.5em"
                      >
                        1.5em
                      </button>
                    </div>
                    <div class="text-xs theme-text-muted mt-1">
                      Controls the vertical padding below each paragraph in the editor.
                    </div>
                  </div>
                </div>
              </div>
            </Show>

            {/* General Tab */}
            <Show when={activeTab() === "general"}>
              <div class="space-y-8">
                {/* Appearance */}
                <div class="space-y-4">
                  <h3 class="text-lg font-semibold theme-text-primary flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                      />
                    </svg>
                    Appearance
                  </h3>

                  <label class="flex items-center justify-between">
                    <div class="flex flex-col">
                      <span class="text-sm font-medium theme-text-secondary">Dark Theme</span>
                      <span class="text-xs theme-text-muted">
                        Switch between light and dark appearance
                      </span>
                    </div>
                    <button
                      onClick={handleThemeToggle}
                      class={`relative inline-flex h-6 w-11 items-center border transition-colors ${
                        currentTheme() === "dark" ? "theme-border-focus" : "theme-border-primary"
                      }`}
                    >
                      <span
                        class={`inline-block h-4 w-4 transform theme-border-hover border transition-transform ${
                          currentTheme() === "dark" ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </label>

                  <div class="flex items-center space-x-4 text-sm theme-text-tertiary">
                    <div class="flex items-center space-x-2">
                      <div class="w-4 h-4 theme-border-primary border theme-bg-secondary rounded-sm"></div>
                      <span>Light</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <div class="w-4 h-4 border border-gray-600 bg-gray-800 rounded-sm"></div>
                      <span>Dark</span>
                    </div>
                  </div>
                </div>

                {/* Data Management */}
                <div class="space-y-4 theme-border-secondary border-t pt-6">
                  <h3 class="text-lg font-semibold theme-text-primary">Data Management</h3>

                  <div class="space-y-3">
                    <button
                      onClick={handleClearBooks}
                      disabled={isClearing()}
                      class="w-full theme-btn-primary font-medium py-2 px-4 transition-colors duration-200 disabled:opacity-50"
                    >
                      {isClearing() ? "Clearing..." : "Clear All Books"}
                    </button>

                    <button
                      onClick={handleClearConfig}
                      disabled={isClearing()}
                      class="w-full theme-btn-primary font-medium py-2 px-4 transition-colors duration-200 disabled:opacity-50"
                    >
                      {isClearing() ? "Clearing..." : "Clear All Configuration"}
                    </button>
                  </div>
                </div>
              </div>
            </Show>

            {/* API Keys Tab */}
            <Show when={activeTab() === "api"}>
              <div class="space-y-8">
                {/* Google API Configuration Section */}
                <div class="space-y-4">
                  <h3 class="text-lg font-semibold theme-text-primary flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                      />
                    </svg>
                    Google API Configuration
                  </h3>

                  <div class="theme-alert">
                    <div class="flex items-start space-x-3">
                      <div class="flex-shrink-0">
                        <svg
                          class="w-6 h-6 theme-text-tertiary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <h4 class="text-sm font-medium theme-text-primary">
                          API Keys Required for Google Drive Sync
                        </h4>
                        <p class="text-sm theme-text-secondary mt-1">
                          To enable Google Drive sync, you need to provide your own Google API
                          credentials. Visit the Google Cloud Console to create a project and get
                          your API keys.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div>
                      <label class="block text-sm font-medium theme-text-secondary mb-1">
                        Google Client ID
                      </label>
                      <input
                        type="text"
                        value={googleClientId()}
                        onInput={(e) => setGoogleClientId(e.currentTarget.value)}
                        placeholder="your-client-id.apps.googleusercontent.com"
                        class="w-full px-3 py-2 theme-input"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium theme-text-secondary mb-1">
                        Google API Key
                      </label>
                      <input
                        type="password"
                        value={googleApiKey()}
                        onInput={(e) => setGoogleApiKey(e.currentTarget.value)}
                        placeholder="Your Google API Key"
                        class="w-full px-3 py-2 theme-input"
                      />
                    </div>

                    <button
                      onClick={handleSaveApiKeys}
                      class="theme-btn-primary font-medium py-2 px-4 transition-colors duration-200"
                    >
                      Save API Keys
                    </button>
                  </div>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div class="flex items-center justify-between p-6 theme-border-secondary border-t">
            <button
              onClick={() => settingsStore.resetToDefaults()}
              class="text-sm theme-text-tertiary hover:theme-text-secondary underline"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleCloseModal}
              class="theme-btn-primary font-medium py-2 px-4 transition-colors duration-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SettingsModal;
