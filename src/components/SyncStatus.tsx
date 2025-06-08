import { Component, createSignal, onMount, onCleanup } from "solid-js";
import { dataService, SyncStatus } from "../services/dataService";

const SyncStatusComponent: Component = () => {
  const [syncStatus, setSyncStatus] = createSignal<SyncStatus>("offline");
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
      case "manual":
        return "🔄";
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
      case "manual":
        return "Manual Sync";
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
      case "manual":
        return "text-blue-600";
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
    </div>
  );
};

export default SyncStatusComponent;
