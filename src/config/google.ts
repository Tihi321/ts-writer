// Google API Configuration
export const GOOGLE_CONFIG = {
  // API keys are now stored in IndexedDB for security
  // Use the settings to configure these values

  // App folder name in Google Drive
  APP_FOLDER_NAME: "TSWriter",

  // Current scopes - includes user info for modern auth
  SCOPES:
    "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",

  // Enhanced scopes for more user information
  // Uncomment and use these for additional features:
  ENHANCED_SCOPES: [
    "https://www.googleapis.com/auth/drive.file", // Current: File access
    "https://www.googleapis.com/auth/userinfo.profile", // Profile info
    "https://www.googleapis.com/auth/userinfo.email", // Email address
    "https://www.googleapis.com/auth/drive.metadata.readonly", // Drive storage info
    "https://www.googleapis.com/auth/calendar.readonly", // Calendar events
    // "https://www.googleapis.com/auth/gmail.readonly", // Gmail access
    // "https://www.googleapis.com/auth/contacts.readonly", // Contacts
    // "https://www.googleapis.com/auth/photoslibrary.readonly", // Photos
  ].join(" "),

  // Discovery docs for additional APIs
  DISCOVERY_DOCS: [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    // Uncomment these for additional APIs:
    // "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    // "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
  ],

  // MIME types for Google Drive
  MIME_TYPES: {
    FOLDER: "application/vnd.google-apps.folder",
    JSON: "application/json",
    MARKDOWN: "text/markdown",
    TEXT: "text/plain",
  },
} as const;

// Example of how to use enhanced scopes:
// 1. Replace SCOPES with ENHANCED_SCOPES in your googleAuth.ts
// 2. Add the discovery docs you need
// 3. Update your Google Cloud Console OAuth consent screen
// 4. Re-authenticate users to get new permissions

/* 
To enable enhanced user information:

1. Update your Google Cloud Console:
   - Go to APIs & Services > OAuth consent screen
   - Add the new scopes to your app
   - Update the app description to mention what data you'll access

2. Update this configuration:
   - Replace SCOPES with ENHANCED_SCOPES
   - Uncomment the discovery docs you need

3. Users will need to re-authenticate to grant new permissions

4. Use the googleUserInfoService to access the additional data
*/
