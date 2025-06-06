import { Component, Show, createSignal } from "solid-js";
import { googleAuth, GoogleUser } from "../services/googleAuth";

const GoogleAuth: Component = () => {
  const [isSigningIn, setIsSigningIn] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setError(null);
      await googleAuth.signIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await googleAuth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign out");
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <Show when={googleAuth.loading}>
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-gray-600">Initializing Google authentication...</p>
        </div>
      </Show>

      <Show when={!googleAuth.loading && !googleAuth.signedIn}>
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-900 mb-4">Welcome to TSWritter</h2>
          <p class="text-gray-600 mb-6">
            Sign in with your Google account to sync your writing projects to Google Drive.
          </p>

          <Show when={error()}>
            <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p class="text-red-800 text-sm">{error()}</p>
            </div>
          </Show>

          <button
            onClick={handleSignIn}
            disabled={isSigningIn()}
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
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
            {isSigningIn() ? "Signing in..." : "Sign in with Google"}
          </button>

          <p class="text-xs text-gray-500 mt-4">
            Your data will be stored securely in your Google Drive and synced across devices.
          </p>
        </div>
      </Show>

      <Show when={!googleAuth.loading && googleAuth.signedIn && googleAuth.currentUser}>
        <div class="text-center">
          <div class="flex items-center justify-center mb-4">
            <img
              src={googleAuth.currentUser!.picture}
              alt={googleAuth.currentUser!.name}
              class="w-12 h-12 rounded-full mr-3"
            />
            <div class="text-left">
              <h3 class="font-medium text-gray-900">{googleAuth.currentUser!.name}</h3>
              <p class="text-sm text-gray-600">{googleAuth.currentUser!.email}</p>
            </div>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
            <p class="text-green-800 text-sm">✓ Connected to Google Drive</p>
          </div>

          <Show when={error()}>
            <div class="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p class="text-red-800 text-sm">{error()}</p>
            </div>
          </Show>

          <button
            onClick={handleSignOut}
            class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </Show>
    </div>
  );
};

export default GoogleAuth;
