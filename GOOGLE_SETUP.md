# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration for TSWritter's frontend-only version.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "TSWritter App")
5. Click "Create"

## Step 2: Enable Google Drive API

1. In your Google Cloud project, go to the [API Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to the [Credentials page](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "TSWritter"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: `https://www.googleapis.com/auth/drive.file`
   - Add test users (your email) if in testing mode
4. For the OAuth client ID:
   - Application type: "Web application"
   - Name: "TSWritter Web Client"
   - Authorized JavaScript origins: Add your domain(s):
     - `http://localhost:3000` (for development)
     - Your production domain (e.g., `https://yourapp.com`)
   - Authorized redirect URIs: Same as origins
5. Click "Create"
6. Copy the "Client ID" that appears

## Step 4: Configure the Application

1. Open `src/frontend/src/config/google.ts`
2. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
3. Optionally, create an API key for better rate limits:
   - Go back to the Credentials page
   - Click "Create Credentials" → "API key"
   - Copy the API key
   - Replace `YOUR_GOOGLE_API_KEY_HERE` with your API key
   - Restrict the API key to Google Drive API for security

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   cd src/frontend
   yarn dev
   ```
2. Open your browser and navigate to the app
3. You should see a Google sign-in button
4. Click it and authorize the application
5. Once signed in, the app will create a "TSWritter Data" folder in your Google Drive

## File Structure in Google Drive

The app will create the following structure in your Google Drive:

```
TSWritter Data/
├── BookName1/
│   ├── book.json
│   └── chapters/
│       ├── chapter1.md
│       └── chapter2.md
├── BookName2/
│   ├── book.json
│   └── chapters/
│       └── chapter1.md
```

## Security Notes

- The app only requests access to files it creates (`drive.file` scope)
- Your data is stored in your personal Google Drive
- The app works offline and syncs when you're online
- No data is sent to any third-party servers

## Troubleshooting

### "Error 403: access_denied"

- Make sure your domain is added to "Authorized JavaScript origins"
- Check that the OAuth consent screen is properly configured

### "Error 400: redirect_uri_mismatch"

- Verify that your current URL matches the authorized redirect URIs

### "The app is blocked"

- If you see this message, you need to verify your app in the OAuth consent screen
- For personal use, you can add yourself as a test user

### Sync Issues

- Check your internet connection
- Try signing out and signing back in
- Check the browser console for error messages

## Development vs Production

### Development

- Use `http://localhost:3000` in authorized origins
- You can use the app in "testing" mode with test users

### Production

- Add your production domain to authorized origins
- Consider publishing your OAuth consent screen for public use
- Implement proper error handling and user feedback

## Privacy and Data Handling

- All data is stored in the user's Google Drive
- The app uses local IndexedDB for offline access
- No user data is collected or stored on external servers
- Users have full control over their data through Google Drive

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Google Cloud Console configuration
3. Ensure all required APIs are enabled
4. Check that your OAuth credentials are correctly configured
