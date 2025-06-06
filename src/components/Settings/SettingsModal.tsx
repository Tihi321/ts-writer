import { Component, Show, createSignal } from "solid-js";
import { settingsStore } from "../../stores/settingsStore";
import { googleAuth } from "../../services/googleAuth";

const SettingsModal: Component = () => {
  const [isSigningIn, setIsSigningIn] = createSignal(false);
  const [authError, setAuthError] = createSignal<string | null>(null);

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
            {/* Google Drive Sync Section */}
            <div class="space-y-4">
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

                {/* Sync Settings */}
                <div class="space-y-3">
                  <label class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-700">Auto-sync interval</span>
                    <select
                      value={settingsStore.settings.autoSyncInterval}
                      onChange={(e) =>
                        settingsStore.updateSetting(
                          "autoSyncInterval",
                          parseInt(e.currentTarget.value)
                        )
                      }
                      class="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value={1}>1 minute</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </label>
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

              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">Offline-only mode</span>
                <button
                  onClick={() => settingsStore.toggleOfflineMode()}
                  class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settingsStore.settings.offlineMode ? "bg-blue-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settingsStore.settings.offlineMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Auto-save Section */}
            <div class="space-y-4 border-t border-gray-200 pt-6">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
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
                <span class="text-sm font-medium text-gray-700">Enable auto-save</span>
                <button
                  onClick={() =>
                    settingsStore.updateSetting("autoSave", !settingsStore.settings.autoSave)
                  }
                  class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settingsStore.settings.autoSave ? "bg-green-600" : "bg-gray-200"
                  }`}
                >
                  <span
                    class={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settingsStore.settings.autoSave ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>

              <Show when={settingsStore.settings.autoSave}>
                <label class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Auto-save interval</span>
                  <select
                    value={settingsStore.settings.autoSaveInterval}
                    onChange={(e) =>
                      settingsStore.updateSetting(
                        "autoSaveInterval",
                        parseInt(e.currentTarget.value)
                      )
                    }
                    class="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes</option>
                  </select>
                </label>
              </Show>
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
