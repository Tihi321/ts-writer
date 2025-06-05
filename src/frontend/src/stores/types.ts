// src/frontend/src/stores/types.ts

// Type for a chapter's metadata (as stored in book.json)
export interface Chapter {
  id: string;
  title: string;
  fileName: string;
}

// Type for a full chapter including its content
export interface ChapterWithContent extends Chapter {
  content: string;
}

// Type for an idea (as stored in book.json)
export interface Idea {
  id: string;
  text: string;
  order: number;
}
