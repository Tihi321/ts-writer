import { Component, createSignal, onMount, onCleanup } from "solid-js";
import { dataService, SyncStatus } from "../services/dataService";
import { googleAuth } from "../services/googleAuth";

const SyncStatusComponent: Component = () => {
  const [syncStatus, setSyncStatus] = createSignal<SyncStatus>("offline");
  const [lastSyncTime, setLastSyncTime] = createSignal<Date | null>(null);
  const [isManualSyncing, setIsManualSyncing] = createSignal(false);

  let intervalId: ReturnType<typeof setInterval>;

  const updateSyncStatus = async () => {
    try {
      const status = await dataService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to get sync status:", error);
      setSyncStatus("error");
    }
  };

  const handleManualSync = async () => {
    if (!googleAuth.signedIn || isManualSyncing()) return;

    try {
      setIsManualSyncing(true);
      await dataService.forceSyncToCloud();
      await dataService.forceSyncFromCloud();
      setLastSyncTime(new Date());
      await updateSyncStatus();
    } catch (error) {
      console.error("Manual sync failed:", error);
      setSyncStatus("error");
    } finally {
      setIsManualSyncing(false);
    }
  };

  onMount(() => {
    updateSyncStatus();
    // Update sync status every 30 seconds
    intervalId = setInterval(updateSyncStatus, 30000);
  });

  onCleanup(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  const getStatusIcon = () => {
    switch (syncStatus()) {
      case "synced":
        return "✓";
      case "pending":
        return "⏳";
      case "offline":
        return "📱";
      case "error":
        return "⚠️";
      default:
        return "?";
    }
  };

  const getStatusText = () => {
    switch (syncStatus()) {
      case "synced":
        return "Synced";
      case "pending":
        return "Syncing...";
      case "offline":
        return "Offline";
      case "error":
        return "Sync Error";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (syncStatus()) {
      case "synced":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "offline":
        return "text-gray-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div class="flex items-center space-x-2 text-sm">
      <div class={`flex items-center space-x-1 ${getStatusColor()}`}>
        <span class="text-lg">{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
      </div>

      {googleAuth.signedIn && (
        <button
          onClick={handleManualSync}
          disabled={isManualSyncing() || syncStatus() === "pending"}
          class="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded transition-colors duration-200"
          title="Force sync with Google Drive"
        >
          {isManualSyncing() ? (
            <div class="flex items-center space-x-1">
              <div class="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
              <span>Syncing...</span>
            </div>
          ) : (
            "🔄 Sync"
          )}
        </button>
      )}

      {lastSyncTime() && (
        <span class="text-xs text-gray-500">Last sync: {lastSyncTime()!.toLocaleTimeString()}</span>
      )}
    </div>
  );
};

export default SyncStatusComponent;
