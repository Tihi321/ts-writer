import { createSignal } from "solid-js";
import { GOOGLE_CONFIG } from "../config/google";
import { indexedDBService } from "./indexedDB";

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

// Declare global types for Google Identity Services only
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
          revoke: (email: string, callback: () => void) => void;
        };
        oauth2: {
          initTokenClient: (config: any) => any;
          hasGrantedAllScopes: (token: any, ...scopes: string[]) => boolean;
        };
      };
    };
  }
}

class GoogleAuthService {
  private isInitialized = false;
  private isSignedInSignal = createSignal(false);
  private userSignal = createSignal<GoogleUser | null>(null);
  private isLoadingSignal = createSignal(true);
  private tokenClient: any = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number | null = null;

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

      if (!clientId) {
        throw new Error("Google Client ID not configured. Please set it in Settings.");
      }

      // Check for stored authentication state
      await this.restoreAuthState();

      // Load Google Identity Services
      await this.loadGoogleIdentityServices();

      // Initialize the OAuth2 token client with popup mode
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GOOGLE_CONFIG.SCOPES,
        ux_mode: "popup",
        callback: (response: any) => {
          if (response.error) {
            console.error("Token client error:", response.error);
            return;
          }
          this.handleTokenResponse(response);
        },
      });

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Google Auth:", error);
      throw new Error("Failed to initialize Google authentication");
    } finally {
      this.setIsLoading(false);
    }
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
      document.head.appendChild(script);
    });
  }

  private handleTokenResponse(response: any): void {
    this.accessToken = response.access_token;

    // Calculate token expiration (Google tokens typically expire in 1 hour)
    const expiresIn = response.expires_in || 3600; // Default to 1 hour
    this.tokenExpiresAt = Date.now() + expiresIn * 1000;

    this.setIsSignedIn(true);
    this.fetchUserInfo();
    this.saveAuthState();
  }

  private async saveAuthState(): Promise<void> {
    if (this.accessToken && this.currentUser) {
      try {
        const authState = {
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          tokenExpiresAt: this.tokenExpiresAt,
          user: this.currentUser,
          timestamp: Date.now(),
        };
        localStorage.setItem("tswriter_auth_state", JSON.stringify(authState));
      } catch (error) {
        console.error("Failed to save auth state:", error);
      }
    }
  }

  private async restoreAuthState(): Promise<void> {
    try {
      const storedState = localStorage.getItem("tswriter_auth_state");
      if (!storedState) {
        return;
      }

      const authState = JSON.parse(storedState);

      // Check if the stored state is not too old (7 days max)
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      if (Date.now() - authState.timestamp > maxAge) {
        localStorage.removeItem("tswriter_auth_state");
        return;
      }

      // Check if token is expired
      if (authState.tokenExpiresAt && Date.now() > authState.tokenExpiresAt) {
        localStorage.removeItem("tswriter_auth_state");
        return;
      }

      // Verify the token is still valid by making a test request
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${authState.accessToken}`,
        },
      });

      if (response.ok) {
        this.accessToken = authState.accessToken;
        this.refreshToken = authState.refreshToken;
        this.tokenExpiresAt = authState.tokenExpiresAt;
        this.setUser(authState.user);
        this.setIsSignedIn(true);
      } else {
        localStorage.removeItem("tswriter_auth_state");
      }
    } catch (error) {
      console.error("Failed to restore auth state:", error);
      localStorage.removeItem("tswriter_auth_state");
    }
  }

  private async fetchUserInfo(): Promise<void> {
    if (!this.accessToken) return;

    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }

      const userInfo = await response.json();
      this.setUser({
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture,
      });

      // Save auth state after successful user info fetch
      this.saveAuthState();
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      this.setUser(null);
      this.setIsSignedIn(false);
    }
  }

  async signIn(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (!this.tokenClient) {
        throw new Error("Token client not initialized");
      }

      // Request access token in popup mode
      this.tokenClient.requestAccessToken({
        prompt: "consent",
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      throw new Error("Failed to sign in to Google");
    }
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized || !this.accessToken) return;

    try {
      // Revoke the access token
      await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
        method: "POST",
        headers: {
          "Content-type": "application/x-www-form-urlencoded",
        },
      });

      this.accessToken = null;
      this.setIsSignedIn(false);
      this.setUser(null);

      // Clear stored auth state
      localStorage.removeItem("tswriter_auth_state");
    } catch (error) {
      console.error("Sign out failed:", error);
      throw new Error("Failed to sign out");
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async ensureValidToken(): Promise<string> {
    if (!this.isInitialized || !this.signedIn || !this.accessToken) {
      throw new Error("User not signed in");
    }

    // Check if token is expired or will expire soon (within 5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    if (this.tokenExpiresAt && Date.now() > this.tokenExpiresAt - fiveMinutes) {
      // Clear the expired token and force re-authentication
      await this.signOut();
      throw new Error("Token expired, please sign in again");
    }

    return this.accessToken;
  }
}

// Create singleton instance
export const googleAuth = new GoogleAuthService();

// Note: Do not auto-initialize here. Let the data service handle initialization
// after IndexedDB is ready.
