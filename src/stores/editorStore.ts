import { createSignal } from "solid-js";

export type EditorMode = "write" | "code";
export type TextSize = 50 | 75 | 100;

const [mode, setMode] = createSignal<EditorMode>("write");
const [textSize, setTextSize] = createSignal<TextSize>(100);

export const editorStore = {
  // Mode
  mode,
  setMode,
  toggleMode: () => setMode(mode() === "write" ? "code" : "write"),

  // Text Size
  textSize,
  setTextSize,
};
