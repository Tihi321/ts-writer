# TSWritter - Frontend-Only Writing App

A modern, offline-first writing application built with Solid.js that works entirely in your browser.

## ✨ Features

- **📱 Offline-First**: Works completely offline with browser storage
- **☁️ Optional Cloud Sync**: Connect Google Drive for backup and cross-device sync
- **📝 Rich Writing Experience**: WYSIWYG and markdown editing modes
- **📚 Project Organization**: Organize writing into books and chapters
- **💡 Ideas Capture**: Built-in note-taking for each chapter
- **🎨 Modern UI**: Clean, distraction-free interface
- **⚡ Fast & Responsive**: No server required, runs entirely in browser

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   cd src/frontend
   yarn install
   ```

2. **Start the development server:**

   ```bash
   yarn dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

4. **Start writing:**
   - Create your first book
   - Add chapters and start writing
   - Your work is automatically saved locally

## ☁️ Enable Cloud Sync (Optional)

To sync your work across devices and backup to Google Drive:

1. **Click the Settings button** (⚙️) in the top toolbar
2. **Follow the Google setup guide** in `GOOGLE_SETUP.md`
3. **Connect your Google account** in the settings modal
4. **Your work will automatically sync** to Google Drive

## 🏗️ Architecture

- **Frontend**: Solid.js with TypeScript
- **Local Storage**: IndexedDB for offline data
- **Cloud Storage**: Google Drive API (optional)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## 📁 Project Structure

```
src/frontend/
├── src/
│   ├── components/     # UI components
│   ├── stores/         # State management
│   ├── services/       # Data services (IndexedDB, Google Drive)
│   ├── config/         # Configuration files
│   └── types/          # TypeScript definitions
├── package.json
└── vite.config.ts
```

## 🔧 Development

- **Local Development**: `yarn dev`
- **Build for Production**: `yarn build`
- **Preview Production**: `yarn preview`

## 📖 Documentation

- `GOOGLE_SETUP.md` - How to set up Google Drive integration
- `GOOGLE_USER_INFO.md` - Available Google API features
- `MIGRATION_COMPLETE.md` - Migration details from backend architecture

## 🎯 Key Benefits

1. **No Server Required**: Runs entirely in your browser
2. **Privacy First**: Your data stays on your device unless you choose to sync
3. **Works Offline**: Write anywhere, anytime, even without internet
4. **Cross-Platform**: Works on any device with a modern browser
5. **Optional Cloud**: Choose when and what to sync to Google Drive

## 🛠️ Tech Stack

- **Solid.js** - Reactive UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **IndexedDB** - Browser database
- **Google Drive API** - Cloud storage (optional)
- **Vite** - Build tool and dev server

---

**Start writing today!** No account required, no server setup needed. Just open the app and begin your next great story.
