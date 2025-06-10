# PWA (Progressive Web App) Setup for TSWriter

## What has been configured:

### 1. Web App Manifest (`public/manifest.json`)

- **`display: "fullscreen"`** - This ensures the app launches in fullscreen mode on Android when added to home screen
- **`orientation: "portrait"`** - Locks the app to portrait mode
- **Theme colors** - Consistent branding
- **SVG Icons** - Scalable vector icons for all screen sizes

### 2. HTML Meta Tags (`index.html`)

- PWA-specific meta tags for Android and iOS
- **`mobile-web-app-capable`** - Enables full-screen mode on Android
- **`apple-mobile-web-app-status-bar-style: black-translucent`** - Hides status bar on iOS

### 3. Service Worker (`src/serviceWorker.ts`)

- Enables offline functionality
- Handles PWA installation prompts
- Caches resources for better performance

## ✅ Icons Configured:

### SVG Icon (`src/assets/icon.svg`)

- **Scalable Vector Graphics** - Works perfectly at any size
- **Single file** - No need for multiple PNG files
- **Modern design** - Represents markdown editing with # symbol and text lines
- **Optimized for PWA** - Includes `maskable` and `any` purposes
- **Cross-platform** - Works on Android, iOS, and desktop

## Testing the PWA:

### 1. Test the Setup

1. Build and serve your app
2. Open Chrome DevTools > Application > Manifest
3. Verify the manifest loads correctly
4. Check that the SVG icon displays properly

### 2. Test on Mobile

1. Open your app in Chrome on Android
2. Look for the "Add to Home Screen" prompt
3. Add the app to your home screen
4. Launch from home screen - should open in fullscreen mode!

## How it works:

When users visit your app on Android Chrome and add it to their home screen:

1. The app will launch in **fullscreen mode** (no browser toolbar)
2. It will look and feel like a native app
3. The status bar will be hidden for maximum screen real estate
4. The app will have offline capabilities through the service worker

## Additional PWA Features:

- Offline functionality
- App-like experience
- Installable from browser
- Background sync capabilities (can be added later)
- Push notifications (can be added later)
