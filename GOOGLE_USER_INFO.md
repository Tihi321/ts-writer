# Google User Information Access Guide

## 🔐 What Information Can You Get When Users Sign In with Google?

When users sign in with Google and approve permissions, you can access a wealth of information through various Google APIs. Here's a comprehensive overview:

## 📊 Currently Available (Basic Setup)

With your current minimal setup, you get:

- **User ID** - Unique Google identifier
- **Name** - Full display name
- **Email** - Primary email address
- **Profile Picture** - Avatar URL
- **Google Drive Access** - Files created by your app

## 🚀 Enhanced Information Available

### 1. Extended Profile Information

**Scope:** `https://www.googleapis.com/auth/userinfo.profile`

```typescript
{
  id: "user-google-id",
  name: "John Doe",
  givenName: "John",
  familyName: "Doe",
  picture: "https://...",
  locale: "en-US"
}
```

### 2. Google Drive Storage & Activity

**Scope:** `https://www.googleapis.com/auth/drive.metadata.readonly`

```typescript
{
  storageQuota: {
    limit: "17179869184", // 16GB in bytes
    usage: "2147483648",  // 2GB used
    usageInDrive: "1073741824",
    usageInDriveTrash: "536870912"
  },
  recentFiles: [
    {
      id: "file-id",
      name: "Document.pdf",
      modifiedTime: "2024-01-15T10:30:00Z",
      mimeType: "application/pdf",
      size: "1048576"
    }
  ]
}
```

### 3. Calendar Information

**Scope:** `https://www.googleapis.com/auth/calendar.readonly`

```typescript
{
  events: [
    {
      id: "event-id",
      summary: "Team Meeting",
      start: { dateTime: "2024-01-15T14:00:00Z" },
      end: { dateTime: "2024-01-15T15:00:00Z" },
      description: "Weekly team sync",
      attendees: [...],
      location: "Conference Room A"
    }
  ]
}
```

### 4. Gmail Information

**Scope:** `https://www.googleapis.com/auth/gmail.readonly`

```typescript
{
  labels: [
    { id: "INBOX", name: "INBOX", type: "system" },
    { id: "custom-1", name: "Work", type: "user" },
    { id: "custom-2", name: "Personal", type: "user" }
  ],
  unreadCount: 42,
  recentEmails: [...] // With additional scopes
}
```

### 5. Google Photos

**Scope:** `https://www.googleapis.com/auth/photoslibrary.readonly`

```typescript
{
  albums: [
    {
      id: "album-id",
      title: "Vacation 2024",
      mediaItemsCount: "156",
      coverPhotoBaseUrl: "https://..."
    }
  ],
  recentPhotos: [...] // Recent media items
}
```

### 6. Contacts

**Scope:** `https://www.googleapis.com/auth/contacts.readonly`

```typescript
{
  contacts: [
    {
      resourceName: "people/contact-id",
      names: [{ displayName: "Jane Smith" }],
      emailAddresses: [{ value: "jane@example.com" }],
      phoneNumbers: [{ value: "+1234567890" }],
    },
  ];
}
```

### 7. YouTube Data

**Scope:** `https://www.googleapis.com/auth/youtube.readonly`

```typescript
{
  channels: [...],
  playlists: [...],
  subscriptions: [...],
  watchHistory: [...] // If available
}
```

## 🛠 Implementation Examples

### Basic Enhanced Setup

```typescript
// In google.ts - Replace SCOPES with:
SCOPES: [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
].join(" ");
```

### Usage in Your App

```typescript
import { googleUserInfoService } from "./services/googleUserInfo";

// Get comprehensive user info
const userInfo = await googleUserInfoService.getComprehensiveUserInfo();

// Get specific information
const driveStorage = await googleUserInfoService.getDriveStorageInfo();
const calendarEvents = await googleUserInfoService.getCalendarEvents();
const gmailLabels = await googleUserInfoService.getGmailLabels();
```

## 🎯 Practical Use Cases for TSWritter

### 1. Writer Dashboard Enhancement

- **Drive Storage**: Show available space for documents
- **Recent Activity**: Display recently modified writing files
- **Calendar Integration**: Show writing schedule/deadlines

### 2. Productivity Features

- **Gmail Integration**: Quick access to research emails
- **Calendar Sync**: Writing session scheduling
- **Contact Access**: Character name inspiration from contacts

### 3. Backup & Sync Intelligence

- **Storage Monitoring**: Warn when approaching Drive limits
- **Activity Tracking**: Show sync history and file changes
- **Multi-device Awareness**: Detect edits from other devices

## 🔧 Setup Steps

### 1. Update Google Cloud Console

```bash
# Go to: https://console.cloud.google.com/
# Navigate to: APIs & Services > OAuth consent screen
# Add new scopes:
- userinfo.profile
- userinfo.email
- drive.metadata.readonly
- calendar.readonly
```

### 2. Update Your Configuration

```typescript
// In src/frontend/src/config/google.ts
export const GOOGLE_CONFIG = {
  CLIENT_ID: "your-client-id",
  API_KEY: "your-api-key",
  SCOPES: ENHANCED_SCOPES, // Use enhanced scopes
  DISCOVERY_DOCS: [
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  ],
};
```

### 3. Add User Info Demo (Optional)

```typescript
// In your App.tsx or create a new route
import { UserInfoDemo } from "./components/UserInfoDemo";

// Add to your routing or as a dev tool
<UserInfoDemo />;
```

## 🔒 Privacy & Security Considerations

### User Consent

- **Transparent Permissions**: Clearly explain what data you'll access
- **Minimal Scopes**: Only request permissions you actually need
- **Progressive Consent**: Start with basic scopes, add more as needed

### Data Handling

- **Local Storage**: Use IndexedDB for caching, not sensitive data
- **No Server Storage**: Keep user data in browser/Google Drive only
- **Encryption**: Consider encrypting sensitive cached data

### Best Practices

```typescript
// Always check if user has granted specific permissions
try {
  const calendarEvents = await googleUserInfoService.getCalendarEvents();
  // Use calendar data
} catch (error) {
  // Gracefully handle missing permissions
  console.warn("Calendar access not available:", error);
}
```

## 📱 User Experience

### Permission Request Flow

1. **Initial Sign-in**: Basic profile + Drive access
2. **Feature Discovery**: Show what's possible with more permissions
3. **Progressive Enhancement**: Request additional scopes when needed
4. **Clear Benefits**: Explain how each permission improves the experience

### Example Permission Request UI

```typescript
const requestEnhancedPermissions = async () => {
  const benefits = [
    "📊 See your Drive storage usage",
    "📅 Integrate with your calendar",
    "📧 Quick access to research emails",
    "🔄 Better sync intelligence",
  ];

  // Show benefits before requesting permissions
  if (await showPermissionDialog(benefits)) {
    // Update scopes and re-authenticate
    await googleAuth.requestAdditionalScopes(ENHANCED_SCOPES);
  }
};
```

## 🚀 Next Steps

1. **Try the Demo**: Use `UserInfoDemo` component to see available data
2. **Choose Your Scopes**: Select permissions that add value to TSWritter
3. **Update Configuration**: Add chosen scopes to your Google config
4. **Enhance UI**: Show relevant user information in your interface
5. **Test Thoroughly**: Ensure graceful handling of missing permissions

## 📚 Additional Resources

- [Google OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)
- [Google Drive API](https://developers.google.com/drive/api/v3/reference)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Gmail API](https://developers.google.com/gmail/api/reference/rest)
- [Google Photos API](https://developers.google.com/photos/library/reference/rest)

---

**Remember**: With great power comes great responsibility. Only request the permissions you need and always be transparent with users about how their data will be used.
