import { createSignal } from "solid-js";

export interface AppSettings {
  googleSyncEnabled: boolean;
  autoSignIn: boolean; // New setting for automatic sign-in
  autoSyncEnabled: boolean; // Setting for automatic sync
  autoSyncInterval: number; // minutes
  offlineMode: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // seconds
}

const DEFAULT_SETTINGS: AppSettings = {
  googleSyncEnabled: false,
  autoSignIn: true, // Enabled by default
  autoSyncEnabled: false, // Disabled by default
  autoSyncInterval: 5,
  offlineMode: false,
  autoSave: true,
  autoSaveInterval: 30,
};

class SettingsStore {
  private settingsSignal = createSignal<AppSettings>(DEFAULT_SETTINGS);
  private showSettingsSignal = createSignal(false);

  // Public getters
  get settings() {
    return this.settingsSignal[0]();
  }

  get showSettings() {
    return this.showSettingsSignal[0]();
  }

  // Private setters
  private get setSettings() {
    return this.settingsSignal[1];
  }

  private get setShowSettings() {
    return this.showSettingsSignal[1];
  }

  // Initialize settings from localStorage
  initialize(): void {
    try {
      const stored = localStorage.getItem("tswriter-settings");
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        this.setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.warn("Failed to load settings from localStorage:", error);
    }
  }

  // Save settings to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem("tswriter-settings", JSON.stringify(this.settings));
    } catch (error) {
      console.warn("Failed to save settings to localStorage:", error);
    }
  }

  // Update a specific setting
  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.setSettings({ ...this.settings, [key]: value });
    this.saveToStorage();
  }

  // Toggle settings modal
  openSettings(): void {
    this.setShowSettings(true);
  }

  closeSettings(): void {
    this.setShowSettings(false);
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.setSettings(DEFAULT_SETTINGS);
    this.saveToStorage();
  }

  // Enable Google sync
  enableGoogleSync(): void {
    this.updateSetting("googleSyncEnabled", true);
    this.updateSetting("offlineMode", false);
  }

  // Disable Google sync
  disableGoogleSync(): void {
    this.updateSetting("googleSyncEnabled", false);
  }

  // Toggle offline mode
  toggleOfflineMode(): void {
    const newOfflineMode = !this.settings.offlineMode;
    this.updateSetting("offlineMode", newOfflineMode);

    // If enabling offline mode, disable Google sync
    if (newOfflineMode) {
      this.updateSetting("googleSyncEnabled", false);
    }
  }
}

// Create singleton instance
export const settingsStore = new SettingsStore();

// Initialize on import
settingsStore.initialize();
