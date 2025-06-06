// Google API Scopes Configuration
// Add these scopes to GOOGLE_CONFIG.SCOPES to access additional user information

export const GOOGLE_SCOPES = {
  // Currently used scopes
  DRIVE_FILE: "https://www.googleapis.com/auth/drive.file", // Access files created by the app

  // Additional profile information
  PROFILE: "https://www.googleapis.com/auth/userinfo.profile", // Basic profile info
  EMAIL: "https://www.googleapis.com/auth/userinfo.email", // Email address

  // Google Drive extended access
  DRIVE_READONLY: "https://www.googleapis.com/auth/drive.readonly", // Read all Drive files
  DRIVE_METADATA: "https://www.googleapis.com/auth/drive.metadata.readonly", // Drive metadata only
  DRIVE_FULL: "https://www.googleapis.com/auth/drive", // Full Drive access

  // Google Calendar
  CALENDAR_READONLY: "https://www.googleapis.com/auth/calendar.readonly", // Read calendar events
  CALENDAR_EVENTS: "https://www.googleapis.com/auth/calendar.events", // Manage calendar events

  // Gmail
  GMAIL_READONLY: "https://www.googleapis.com/auth/gmail.readonly", // Read Gmail
  GMAIL_LABELS: "https://www.googleapis.com/auth/gmail.labels", // Manage Gmail labels
  GMAIL_COMPOSE: "https://www.googleapis.com/auth/gmail.compose", // Send emails

  // Google Photos
  PHOTOS_READONLY: "https://www.googleapis.com/auth/photoslibrary.readonly", // Read Photos
  PHOTOS_SHARING: "https://www.googleapis.com/auth/photoslibrary.sharing", // Share photos

  // Google Contacts
  CONTACTS_READONLY: "https://www.googleapis.com/auth/contacts.readonly", // Read contacts
  CONTACTS: "https://www.googleapis.com/auth/contacts", // Manage contacts

  // Google Sheets/Docs
  SPREADSHEETS: "https://www.googleapis.com/auth/spreadsheets", // Google Sheets access
  DOCUMENTS: "https://www.googleapis.com/auth/documents", // Google Docs access

  // YouTube
  YOUTUBE_READONLY: "https://www.googleapis.com/auth/youtube.readonly", // Read YouTube data

  // Google Analytics
  ANALYTICS_READONLY: "https://www.googleapis.com/auth/analytics.readonly", // Read Analytics
} as const;

// Information available with each scope
export const SCOPE_INFORMATION = {
  [GOOGLE_SCOPES.PROFILE]: {
    name: "Profile Information",
    description: "Basic profile information like name, profile picture",
    data: ["name", "given_name", "family_name", "picture", "locale"],
  },

  [GOOGLE_SCOPES.EMAIL]: {
    name: "Email Address",
    description: "Primary email address",
    data: ["email", "email_verified"],
  },

  [GOOGLE_SCOPES.DRIVE_METADATA]: {
    name: "Drive Storage Info",
    description: "Storage quota, usage statistics, recent file activity",
    data: ["storage_quota", "storage_usage", "recent_files", "file_metadata"],
  },

  [GOOGLE_SCOPES.CALENDAR_READONLY]: {
    name: "Calendar Events",
    description: "Upcoming calendar events, meeting schedules",
    data: ["events", "calendars", "busy_times", "meeting_schedules"],
  },

  [GOOGLE_SCOPES.GMAIL_READONLY]: {
    name: "Gmail Information",
    description: "Email labels, unread count, recent emails",
    data: ["labels", "unread_count", "recent_emails", "email_threads"],
  },

  [GOOGLE_SCOPES.PHOTOS_READONLY]: {
    name: "Google Photos",
    description: "Photo albums, recent photos",
    data: ["albums", "recent_photos", "photo_metadata"],
  },

  [GOOGLE_SCOPES.CONTACTS_READONLY]: {
    name: "Contacts",
    description: "Contact list, frequently contacted people",
    data: ["contacts", "contact_groups", "frequently_contacted"],
  },
} as const;

// Recommended scope combinations for different use cases
export const SCOPE_COMBINATIONS = {
  // Minimal (current setup)
  MINIMAL: [GOOGLE_SCOPES.DRIVE_FILE],

  // Basic user info
  BASIC_PROFILE: [GOOGLE_SCOPES.DRIVE_FILE, GOOGLE_SCOPES.PROFILE, GOOGLE_SCOPES.EMAIL],

  // Writer-focused features
  WRITER_ENHANCED: [
    GOOGLE_SCOPES.DRIVE_FILE,
    GOOGLE_SCOPES.PROFILE,
    GOOGLE_SCOPES.EMAIL,
    GOOGLE_SCOPES.DRIVE_METADATA, // For storage info and file activity
    GOOGLE_SCOPES.CALENDAR_READONLY, // For writing schedule integration
  ],

  // Full productivity suite
  PRODUCTIVITY_SUITE: [
    GOOGLE_SCOPES.DRIVE_FILE,
    GOOGLE_SCOPES.PROFILE,
    GOOGLE_SCOPES.EMAIL,
    GOOGLE_SCOPES.DRIVE_METADATA,
    GOOGLE_SCOPES.CALENDAR_READONLY,
    GOOGLE_SCOPES.GMAIL_READONLY,
    GOOGLE_SCOPES.CONTACTS_READONLY,
  ],

  // Content creator focused
  CONTENT_CREATOR: [
    GOOGLE_SCOPES.DRIVE_FILE,
    GOOGLE_SCOPES.PROFILE,
    GOOGLE_SCOPES.EMAIL,
    GOOGLE_SCOPES.DRIVE_METADATA,
    GOOGLE_SCOPES.PHOTOS_READONLY,
    GOOGLE_SCOPES.YOUTUBE_READONLY,
  ],
} as const;

// Helper function to get scope description
export function getScopeInfo(scope: string) {
  return SCOPE_INFORMATION[scope as keyof typeof SCOPE_INFORMATION];
}

// Helper function to format scopes for Google Auth
export function formatScopes(scopes: string[]): string {
  return scopes.join(" ");
}
