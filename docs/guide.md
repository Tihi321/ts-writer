**Project Title:**
Web-Based Markdown Editor for Writers

---

**Goal:**
Build a clean, browser-based web app for writers to create and manage books using Markdown (`.md`) files. Each chapter is saved as a separate file on disk. The app enables writing, editing, reordering, and managing chapter-specific ideas.
Before start coding, stop and think it through and make a step by step plan that you will follow, Use yarn as package manager

---

**Core Features:**

1. **Markdown-Based Editor**

   - Write using Markdown syntax in a clean, distraction-free UI.
   - **Text formatting options** for selected text:

     - Bold
     - Italic
     - Headers (H1–H6)
     - Bullet list / numbered list
     - Blockquote
     - Code block / inline code
     - Links
     - Images

   - Toolbar or hotkeys to apply Markdown formatting without typing syntax manually.
   - Preview mode is default mode of writing, code mode is optional / toggleable

2. **Chapter Management**

   - Each chapter = individual `.md` file.
   - Add, delete, rename, and reorder chapters.
   - Drag-and-drop support for reordering (UX bonus).

3. **Ideas Sidebar**

   - Each chapter has a list of “idea” messages tied to it.
   - Add/edit/delete/reorder ideas.
   - Stored alongside the chapter metadata (e.g. in JSON).

4. **Persistence**

   - All data (chapters and idea metadata) stored on disk:

     - Markdown files for content.
     - JSON config for metadata (e.g. chapter order, idea mapping).

---

**Tech Stack:**

- **Frontend:**

  - SolidJS + TypeScript
  - TailwindCSS (optional) for clean UI
  - Markdown editor library or custom light editor with formatting toolbar

- **Backend:**

  - Node.js + Express
  - WebSocket server for real-time sync with frontend
  - File I/O:

    - Read/write `.md` files
    - Manage metadata via a config JSON

---

**Design Constraints:**

- Entirely web-based, runs in browser.
- Clean, minimal UI (zero clutter).
- Local disk persistence: no external DB or cloud sync.
- Fast performance, even with many chapters and idea entries.

---

**Implementation Plan (Step-by-Step):**

1. **Design UI/UX**

   - Layout: three-panel layout — chapter list, editor, ideas.
   - Design toolbar for Markdown formatting.
   - Define file/folder structure on disk.

2. **Backend Setup**

   - Express server setup.
   - WebSocket connection.
   - API for file operations: load/save chapter, update order, manage config JSON.

3. **Frontend Setup**

   - Set up SolidJS + TypeScript scaffold.
   - Build UI components:

     - Markdown editor with formatting toolbar.
     - Chapter list with reorder UI.
     - Idea sidebar with add/edit/remove/reorder.

   - Integrate with backend using WebSocket.

4. **Integrate Persistence**

   - Save `.md` files on change or on save button.
   - Maintain `book.json` with chapter order and idea references.

5. **Refinements**

   - Implement keyboard shortcuts.
   - Autosave feature.
   - Optional: live Markdown preview, theme toggle (dark/light).

---

**Optional Features for Later:**

- Export book (all chapters) into one `.md` or `.pdf`.
- Git integration for versioning.
- Search and replace across chapters.

---
