import { gapi } from "gapi-script";
import { googleAuth } from "./googleAuth";

export interface ExtendedGoogleUser {
  // Basic info (already available)
  id: string;
  name: string;
  email: string;
  picture: string;

  // Additional profile information
  givenName?: string;
  familyName?: string;
  locale?: string;
  timezone?: string;

  // Google Drive information
  driveStorageQuota?: {
    limit: string;
    usage: string;
    usageInDrive: string;
    usageInDriveTrash: string;
  };

  // Account preferences
  preferences?: {
    language?: string;
    country?: string;
  };
}

class GoogleUserInfoService {
  /**
   * Get extended user profile information
   * Requires additional scopes: 'profile', 'email'
   */
  async getExtendedProfile(): Promise<Partial<ExtendedGoogleUser>> {
    if (!googleAuth.signedIn) {
      throw new Error("User not signed in");
    }

    try {
      const token = await googleAuth.ensureValidToken();

      // Get detailed profile information
      const response = await gapi.client.request({
        path: "https://www.googleapis.com/oauth2/v2/userinfo",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = response.result;

      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        givenName: profile.given_name,
        familyName: profile.family_name,
        locale: profile.locale,
      };
    } catch (error) {
      console.error("Failed to get extended profile:", error);
      throw error;
    }
  }

  /**
   * Get Google Drive storage information
   * Requires scope: 'https://www.googleapis.com/auth/drive.metadata.readonly'
   */
  async getDriveStorageInfo(): Promise<any> {
    if (!googleAuth.signedIn) {
      throw new Error("User not signed in");
    }

    try {
      const token = await googleAuth.ensureValidToken();

      const response = await gapi.client.request({
        path: "https://www.googleapis.com/drive/v3/about",
        method: "GET",
        params: {
          fields: "storageQuota,user",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.result;
    } catch (error) {
      console.error("Failed to get drive storage info:", error);
      throw error;
    }
  }

  /**
   * Get user's Google Drive activity (recent files)
   * Requires scope: 'https://www.googleapis.com/auth/drive.metadata.readonly'
   */
  async getRecentDriveActivity(): Promise<any[]> {
    if (!googleAuth.signedIn) {
      throw new Error("User not signed in");
    }

    try {
      const token = await googleAuth.ensureValidToken();

      const response = await gapi.client.request({
        path: "https://www.googleapis.com/drive/v3/files",
        method: "GET",
        params: {
          orderBy: "modifiedTime desc",
          pageSize: 10,
          fields: "files(id,name,modifiedTime,mimeType,size)",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.result.files || [];
    } catch (error) {
      console.error("Failed to get recent drive activity:", error);
      throw error;
    }
  }

  /**
   * Get user's Google Calendar events (if calendar scope is added)
   * Requires scope: 'https://www.googleapis.com/auth/calendar.readonly'
   */
  async getCalendarEvents(): Promise<any[]> {
    if (!googleAuth.signedIn) {
      throw new Error("User not signed in");
    }

    try {
      const token = await googleAuth.ensureValidToken();

      // Load Calendar API if not already loaded
      await gapi.client.load("calendar", "v3");

      const response = await gapi.client.request({
        path: "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        method: "GET",
        params: {
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: "startTime",
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.result.items || [];
    } catch (error) {
      console.error("Failed to get calendar events:", error);
      throw error;
    }
  }

  /**
   * Get user's Gmail labels (if Gmail scope is added)
   * Requires scope: 'https://www.googleapis.com/auth/gmail.readonly'
   */
  async getGmailLabels(): Promise<any[]> {
    if (!googleAuth.signedIn) {
      throw new Error("User not signed in");
    }

    try {
      const token = await googleAuth.ensureValidToken();

      const response = await gapi.client.request({
        path: "https://www.googleapis.com/gmail/v1/users/me/labels",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.result.labels || [];
    } catch (error) {
      console.error("Failed to get Gmail labels:", error);
      throw error;
    }
  }

  /**
   * Get user's Google Photos albums (if Photos scope is added)
   * Requires scope: 'https://www.googleapis.com/auth/photoslibrary.readonly'
   */
  async getPhotosAlbums(): Promise<any[]> {
    if (!googleAuth.signedIn) {
      throw new Error("User not signed in");
    }

    try {
      const token = await googleAuth.ensureValidToken();

      const response = await gapi.client.request({
        path: "https://photoslibrary.googleapis.com/v1/albums",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.result.albums || [];
    } catch (error) {
      console.error("Failed to get Photos albums:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive user information by combining multiple APIs
   */
  async getComprehensiveUserInfo(): Promise<ExtendedGoogleUser> {
    const basicInfo = googleAuth.currentUser;
    if (!basicInfo) {
      throw new Error("User not signed in");
    }

    try {
      // Get extended profile
      const extendedProfile = await this.getExtendedProfile();

      // Get drive storage info
      let driveInfo;
      try {
        driveInfo = await this.getDriveStorageInfo();
      } catch (error) {
        console.warn("Could not get drive storage info:", error);
      }

      return {
        ...basicInfo,
        ...extendedProfile,
        driveStorageQuota: driveInfo?.storageQuota,
        preferences: {
          language: extendedProfile.locale,
        },
      };
    } catch (error) {
      console.error("Failed to get comprehensive user info:", error);
      throw error;
    }
  }
}

// Create singleton instance
export const googleUserInfoService = new GoogleUserInfoService();
