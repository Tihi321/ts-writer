import { Component, Show, createSignal, onMount } from "solid-js";
import { settingsStore } from "../stores/settingsStore";
import { googleAuth } from "../services/googleAuth";
import { indexedDBService } from "../services/indexedDB";

const SettingsModal: Component = () => {
  const [isSigningIn, setIsSigningIn] = createSignal(false);
  const [authError, setAuthError] = createSignal<string | null>(null);
  const [googleClientId, setGoogleClientId] = createSignal("");
  const [googleApiKey, setGoogleApiKey] = createSignal("");
  const [isClearing, setIsClearing] = createSignal(false);

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

  return (
    <Show when={settingsStore.showSettings}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-2xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={handleCloseModal}
              class="text-gray-400 hover:text-gray-600 transition-colors"
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

          {/* Content */}
          <div class="p-6 space-y-8">
            {/* Google API Configuration Section */}
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
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

              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0">
                    <svg
                      class="w-6 h-6 text-yellow-600"
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
                    <h4 class="text-sm font-medium text-yellow-900">
                      API Keys Required for Google Drive Sync
                    </h4>
                    <p class="text-sm text-yellow-700 mt-1">
                      To enable Google Drive sync, you need to provide your own Google API
                      credentials. Visit the Google Cloud Console to create a project and get your
                      API keys.
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Google Client ID
                  </label>
                  <input
                    type="text"
                    value={googleClientId()}
                    onInput={(e) => setGoogleClientId(e.currentTarget.value)}
                    placeholder="your-client-id.apps.googleusercontent.com"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Google API Key</label>
                  <input
                    type="password"
                    value={googleApiKey()}
                    onInput={(e) => setGoogleApiKey(e.currentTarget.value)}
                    placeholder="your-google-api-key"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveApiKeys}
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save API Keys
                </button>
              </div>
            </div>

            {/* Google Drive Sync Section */}
            <div class="space-y-4 border-t border-gray-200 pt-6">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Drive Sync
              </h3>

              <Show when={authError()}>
                <div class="bg-red-50 border border-red-200 rounded-md p-3">
                  <p class="text-red-800 text-sm">{authError()}</p>
                </div>
              </Show>

              <Show when={!googleAuth.signedIn}>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                      <svg
                        class="w-6 h-6 text-blue-600"
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
                      <h4 class="text-sm font-medium text-blue-900">Enable Cloud Sync</h4>
                      <p class="text-sm text-blue-700 mt-1">
                        Connect your Google account to sync your writing projects across devices and
                        backup to Google Drive.
                      </p>
                      <ul class="text-xs text-blue-600 mt-2 space-y-1">
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
                    class="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                  >
                    <Show when={isSigningIn()}>
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <img
                        src={googleAuth.currentUser!.picture}
                        alt={googleAuth.currentUser!.name}
                        class="w-10 h-10 rounded-full"
                      />
                      <div>
                        <h4 class="text-sm font-medium text-green-900">
                          {googleAuth.currentUser!.name}
                        </h4>
                        <p class="text-sm text-green-700">{googleAuth.currentUser!.email}</p>
                        <p class="text-xs text-green-600">✓ Connected to Google Drive</p>
                      </div>
                    </div>
                    <button
                      onClick={handleGoogleSignOut}
                      class="text-sm text-green-700 hover:text-green-900 underline"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </Show>
            </div>

            {/* Local Storage Section */}
            <div class="space-y-4 border-t border-gray-200 pt-6">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
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

              <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0">
                    <svg
                      class="w-6 h-6 text-gray-600"
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
                    <h4 class="text-sm font-medium text-gray-900">Works Offline</h4>
                    <p class="text-sm text-gray-600 mt-1">
                      Your writing is automatically saved to your browser's local storage. You can
                      write even without an internet connection.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Management Section */}
            <div class="space-y-4 border-t border-gray-200 pt-6">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Data Management
              </h3>

              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0">
                    <svg
                      class="w-6 h-6 text-red-600"
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
                    <h4 class="text-sm font-medium text-red-900">Danger Zone</h4>
                    <p class="text-sm text-red-700 mt-1">
                      These actions cannot be undone. Make sure you have backups before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">Clear All Books</h4>
                    <p class="text-sm text-gray-600">
                      Delete all books and chapters from local storage
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearBooks}
                    disabled={isClearing()}
                    class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    {isClearing() ? "Clearing..." : "Clear Books"}
                  </button>
                </div>

                <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900">Clear Configuration</h4>
                    <p class="text-sm text-gray-600">Delete all settings and API keys</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearConfig}
                    disabled={isClearing()}
                    class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    {isClearing() ? "Clearing..." : "Clear Config"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => settingsStore.resetToDefaults()}
              class="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleCloseModal}
              class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
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
