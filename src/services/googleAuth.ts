import { gapi } from "gapi-script";
import { createSignal, createEffect } from "solid-js";
import { GOOGLE_CONFIG } from "../config/google";
import { indexedDBService } from "./indexedDB";

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

class GoogleAuthService {
  private isInitialized = false;
  private isSignedInSignal = createSignal(false);
  private userSignal = createSignal<GoogleUser | null>(null);
  private isLoadingSignal = createSignal(true);

  // Public getters for reactive state
  get signedIn() {
    return this.isSignedInSignal[0]();
  }
  get currentUser() {
    return this.userSignal[0]();
  }
  get loading() {
    return this.isLoadingSignal[0]();
  }

  private get setIsSignedIn() {
    return this.isSignedInSignal[1];
  }
  private get setUser() {
    return this.userSignal[1];
  }
  private get setIsLoading() {
    return this.isLoadingSignal[1];
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.setIsLoading(true);

      // Ensure IndexedDB is initialized first
      await indexedDBService.initialize();

      // Get API keys from database
      const clientId = await indexedDBService.getGoogleClientId();
      const apiKey = await indexedDBService.getGoogleApiKey();

      if (!clientId) {
        throw new Error("Google Client ID not configured. Please set it in Settings.");
      }

      // Load the Google API
      await new Promise<void>((resolve, reject) => {
        gapi.load("auth2", {
          callback: resolve,
          onerror: reject,
        });
      });

      // Load the client library
      await new Promise<void>((resolve, reject) => {
        gapi.load("client", {
          callback: resolve,
          onerror: reject,
        });
      });

      // Initialize the client with API key if available
      const initConfig: any = {
        discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
      };

      if (apiKey) {
        initConfig.apiKey = apiKey;
      }

      await (gapi.client as any).init(initConfig);

      // Initialize the auth2 library
      await gapi.auth2.init({
        client_id: clientId,
        scope: GOOGLE_CONFIG.SCOPES,
      });

      const authInstance = gapi.auth2.getAuthInstance();

      // Set up auth state listeners
      authInstance.isSignedIn.listen((isSignedIn: boolean) => {
        this.setIsSignedIn(isSignedIn);
        if (isSignedIn) {
          this.updateUserInfo();
        } else {
          this.setUser(null);
        }
      });

      // Check current auth state
      const currentlySignedIn = authInstance.isSignedIn.get();
      this.setIsSignedIn(currentlySignedIn);

      if (currentlySignedIn) {
        this.updateUserInfo();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Google Auth:", error);
      throw new Error("Failed to initialize Google authentication");
    } finally {
      this.setIsLoading(false);
    }
  }

  private updateUserInfo(): void {
    const authInstance = gapi.auth2.getAuthInstance();
    const googleUser = authInstance.currentUser.get();
    const profile = googleUser.getBasicProfile();

    this.setUser({
      id: profile.getId(),
      name: profile.getName(),
      email: profile.getEmail(),
      picture: profile.getImageUrl(),
    });
  }

  async signIn(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
    } catch (error) {
      console.error("Sign in failed:", error);
      throw new Error("Failed to sign in to Google");
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
      throw new Error("Failed to sign out");
    }
  }

  getAccessToken(): string | null {
    if (!this.isInitialized || !this.signedIn) return null;

    const authInstance = gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    return user.getAuthResponse().access_token;
  }

  async ensureValidToken(): Promise<string> {
    if (!this.isInitialized || !this.signedIn) {
      throw new Error("User not signed in");
    }

    const authInstance = gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    const authResponse = user.getAuthResponse();

    // Check if token is expired (with 5 minute buffer)
    const now = Date.now();
    const expiresAt = authResponse.expires_at;

    if (expiresAt - now < 5 * 60 * 1000) {
      // 5 minutes
      // Token is expired or about to expire, refresh it
      await user.reloadAuthResponse();
    }

    return user.getAuthResponse().access_token;
  }
}

// Create singleton instance
export const googleAuth = new GoogleAuthService();

// Note: Do not auto-initialize here. Let the data service handle initialization
// after IndexedDB is ready.
