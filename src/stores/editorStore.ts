import { createSignal } from "solid-js";

export type EditorMode = "write" | "code";
export type TextSize = 50 | 75 | 100 | "960px";
export type FontSize = 14 | 16 | 18;
export type PaddingSize = "0.5em" | "1em" | "1.5em";

const [mode, setMode] = createSignal<EditorMode>("write");
const TEXT_SIZE_KEY = "tswriter-textSize";

function loadTextSize(): TextSize {
  const stored = localStorage.getItem(TEXT_SIZE_KEY);
  if (stored === "50" || stored === "75" || stored === "100") return Number(stored) as TextSize;
  if (stored === "960px") return "960px";
  return 100;
}

const [textSize, _setTextSize] = createSignal<TextSize>(loadTextSize());

function setTextSize(size: TextSize) {
  _setTextSize(size);
  localStorage.setItem(TEXT_SIZE_KEY, String(size));
}

const FONT_SIZE_KEY = "tswriter-fontSize";

function loadFontSize(): FontSize {
  const stored = localStorage.getItem(FONT_SIZE_KEY);
  if (stored === "14" || stored === "16" || stored === "18") return Number(stored) as FontSize;
  return 16;
}

const [fontSize, _setFontSize] = createSignal<FontSize>(loadFontSize());

function setFontSize(size: FontSize) {
  _setFontSize(size);
  localStorage.setItem(FONT_SIZE_KEY, String(size));
}

const PADDING_SIZE_KEY = "tswriter-paddingSize";
function loadPaddingSize(): PaddingSize {
  const stored = localStorage.getItem(PADDING_SIZE_KEY);
  if (stored === "0.5em" || stored === "1em" || stored === "1.5em") return stored;
  return "1em";
}
const [paddingSize, _setPaddingSize] = createSignal<PaddingSize>(loadPaddingSize());
function setPaddingSize(size: PaddingSize) {
  _setPaddingSize(size);
  localStorage.setItem(PADDING_SIZE_KEY, size);
}

export const editorStore = {
  // Mode
  mode,
  setMode,
  toggleMode: () => setMode(mode() === "write" ? "code" : "write"),

  // Text Size
  textSize,
  setTextSize,

  // Font Size
  fontSize,
  setFontSize,

  // Padding Size
  paddingSize,
  setPaddingSize,
};
