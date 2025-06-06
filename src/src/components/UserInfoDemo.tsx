import { createSignal, createEffect, Show, For } from "solid-js";
import { googleAuth } from "../services/googleAuth";
import { googleUserInfoService, ExtendedGoogleUser } from "../services/googleUserInfo";

export function UserInfoDemo() {
  const [userInfo, setUserInfo] = createSignal<ExtendedGoogleUser | null>(null);
  const [driveActivity, setDriveActivity] = createSignal<any[]>([]);
  const [calendarEvents, setCalendarEvents] = createSignal<any[]>([]);
  const [gmailLabels, setGmailLabels] = createSignal<any[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const loadUserInfo = async () => {
    if (!googleAuth.signedIn) return;

    setLoading(true);
    setError(null);

    try {
      // Get comprehensive user info
      const info = await googleUserInfoService.getComprehensiveUserInfo();
      setUserInfo(info);

      // Try to get additional information (these may fail if scopes aren't granted)
      try {
        const activity = await googleUserInfoService.getRecentDriveActivity();
        setDriveActivity(activity);
      } catch (err) {
        console.warn("Could not get Drive activity:", err);
      }

      try {
        const events = await googleUserInfoService.getCalendarEvents();
        setCalendarEvents(events);
      } catch (err) {
        console.warn("Could not get Calendar events:", err);
      }

      try {
        const labels = await googleUserInfoService.getGmailLabels();
        setGmailLabels(labels);
      } catch (err) {
        console.warn("Could not get Gmail labels:", err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user info");
    } finally {
      setLoading(false);
    }
  };

  // Load user info when signed in
  createEffect(() => {
    if (googleAuth.signedIn) {
      loadUserInfo();
    } else {
      setUserInfo(null);
      setDriveActivity([]);
      setCalendarEvents([]);
      setGmailLabels([]);
    }
  });

  return (
    <div class="p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">Google User Information Demo</h2>

      <Show when={!googleAuth.signedIn}>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p class="text-yellow-800">
            Please sign in with Google to see available user information.
          </p>
        </div>
      </Show>

      <Show when={googleAuth.signedIn}>
        <div class="space-y-6">
          {/* Refresh Button */}
          <button
            onClick={loadUserInfo}
            disabled={loading()}
            class="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg"
          >
            {loading() ? "Loading..." : "Refresh User Info"}
          </button>

          {/* Error Display */}
          <Show when={error()}>
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-red-800">{error()}</p>
            </div>
          </Show>

          {/* Basic User Info */}
          <Show when={userInfo()}>
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4">Basic Profile Information</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <img
                    src={userInfo()?.picture}
                    alt="Profile"
                    class="w-16 h-16 rounded-full mb-2"
                  />
                  <p>
                    <strong>Name:</strong> {userInfo()?.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {userInfo()?.email}
                  </p>
                  <Show when={userInfo()?.givenName}>
                    <p>
                      <strong>First Name:</strong> {userInfo()?.givenName}
                    </p>
                  </Show>
                  <Show when={userInfo()?.familyName}>
                    <p>
                      <strong>Last Name:</strong> {userInfo()?.familyName}
                    </p>
                  </Show>
                  <Show when={userInfo()?.locale}>
                    <p>
                      <strong>Locale:</strong> {userInfo()?.locale}
                    </p>
                  </Show>
                </div>

                <Show when={userInfo()?.driveStorageQuota}>
                  <div>
                    <h4 class="font-medium mb-2">Google Drive Storage</h4>
                    <p>
                      <strong>Limit:</strong> {formatBytes(userInfo()?.driveStorageQuota?.limit)}
                    </p>
                    <p>
                      <strong>Used:</strong> {formatBytes(userInfo()?.driveStorageQuota?.usage)}
                    </p>
                    <p>
                      <strong>In Drive:</strong>{" "}
                      {formatBytes(userInfo()?.driveStorageQuota?.usageInDrive)}
                    </p>
                    <p>
                      <strong>In Trash:</strong>{" "}
                      {formatBytes(userInfo()?.driveStorageQuota?.usageInDriveTrash)}
                    </p>
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          {/* Recent Drive Activity */}
          <Show when={driveActivity().length > 0}>
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4">Recent Drive Activity</h3>
              <div class="space-y-2">
                <For each={driveActivity().slice(0, 5)}>
                  {(file) => (
                    <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p class="font-medium">{file.name}</p>
                        <p class="text-sm text-gray-600">{file.mimeType}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm">{formatBytes(file.size)}</p>
                        <p class="text-xs text-gray-500">
                          {new Date(file.modifiedTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Calendar Events */}
          <Show when={calendarEvents().length > 0}>
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4">Upcoming Calendar Events</h3>
              <div class="space-y-2">
                <For each={calendarEvents().slice(0, 5)}>
                  {(event) => (
                    <div class="p-2 bg-gray-50 rounded">
                      <p class="font-medium">{event.summary}</p>
                      <Show when={event.start?.dateTime}>
                        <p class="text-sm text-gray-600">
                          {new Date(event.start.dateTime).toLocaleString()}
                        </p>
                      </Show>
                      <Show when={event.description}>
                        <p class="text-sm text-gray-500 truncate">{event.description}</p>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Gmail Labels */}
          <Show when={gmailLabels().length > 0}>
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h3 class="text-lg font-semibold mb-4">Gmail Labels</h3>
              <div class="flex flex-wrap gap-2">
                <For
                  each={gmailLabels()
                    .filter((label) => label.type === "user")
                    .slice(0, 10)}
                >
                  {(label) => (
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {label.name}
                    </span>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Scope Information */}
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold mb-4">Available Information</h3>
            <div class="text-sm space-y-2">
              <p>
                <strong>✅ Currently Available:</strong>
              </p>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Basic profile (name, email, picture)</li>
                <li>Google Drive file access</li>
                {userInfo()?.driveStorageQuota && <li>Drive storage information</li>}
                {driveActivity().length > 0 && <li>Recent Drive activity</li>}
                {calendarEvents().length > 0 && <li>Calendar events</li>}
                {gmailLabels().length > 0 && <li>Gmail labels</li>}
              </ul>

              <p class="mt-4">
                <strong>🔒 Requires Additional Permissions:</strong>
              </p>
              <ul class="list-disc list-inside ml-4 space-y-1">
                <li>Google Photos albums</li>
                <li>Contact information</li>
                <li>YouTube data</li>
                <li>Google Sheets/Docs access</li>
                <li>Gmail compose/send capabilities</li>
              </ul>

              <p class="mt-4 text-gray-600">
                To access additional information, update the scopes in your Google configuration and
                re-authenticate. See <code>googleScopes.ts</code> for available options.
              </p>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

// Helper function to format bytes
function formatBytes(bytes: string | number | undefined): string {
  if (!bytes) return "Unknown";
  const num = typeof bytes === "string" ? parseInt(bytes) : bytes;
  if (isNaN(num)) return "Unknown";

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (num === 0) return "0 Bytes";
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return Math.round((num / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}
