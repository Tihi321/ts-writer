import { Component, createEffect, createSignal, Show, createMemo } from "solid-js";
import { chapterStore } from "../../stores/chapterStore";
import { Chapter } from "../../stores/types";
import { marked } from "marked";

// Optional: Add Tailwind's typography plugin for better preview styling
// npm install -D @tailwindcss/typography
// Then add `require('@tailwindcss/typography')` to plugins in tailwind.config.js
// The 'prose' class used below will then be available.

const EditorArea: Component = () => {
  const [currentContent, setCurrentContent] = createSignal("");
  const [isSaving, setIsSaving] = createSignal(false);
  const [mode, setMode] = createSignal<"edit" | "preview">("preview");
  let textareaRef: HTMLTextAreaElement | undefined;

  createEffect(() => {
    const chapter = chapterStore.selectedChapter();
    if (chapter) {
      setCurrentContent(chapter.content);
      setMode("preview");
    } else {
      setCurrentContent("");
    }
  });

  const handleSave = async () => {
    const chapter = chapterStore.selectedChapter();
    if (!chapter) return;

    setIsSaving(true);
    try {
      await chapterStore.updateChapter(chapter.id, currentContent());
      // Optionally, show a success message
      alert("Chapter saved successfully!");
    } catch (error) {
      alert("Failed to save chapter.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFormat = (wrapChar: string) => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const selectedText = textareaRef.value.substring(start, end);
    const currentValue = textareaRef.value;

    const before = currentValue.substring(0, start);
    const after = currentValue.substring(end);

    const isWrapped = before.endsWith(wrapChar) && after.startsWith(wrapChar);

    if (isWrapped) {
      // Unwrap
      const newText =
        before.substring(0, before.length - wrapChar.length) +
        selectedText +
        after.substring(wrapChar.length);
      setCurrentContent(newText);
      setTimeout(() => {
        textareaRef?.focus();
        textareaRef?.setSelectionRange(start - wrapChar.length, end - wrapChar.length);
      }, 0);
    } else {
      // Wrap
      const newText = `${before}${wrapChar}${selectedText}${wrapChar}${after}`;
      setCurrentContent(newText);
      setTimeout(() => {
        textareaRef?.focus();
        textareaRef?.setSelectionRange(start + wrapChar.length, end + wrapChar.length);
      }, 0);
    }
  };

  const applyFormat = (
    formatType: "bold" | "italic" | "h1" | "h2" | "bulletList" | "orderedList" | "code"
  ) => {
    if (!textareaRef) return;

    if (formatType === "bold") {
      toggleFormat("**");
      return;
    }
    if (formatType === "italic") {
      toggleFormat("*");
      return;
    }
    if (formatType === "code") {
      toggleFormat("`");
      return;
    }

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const currentValue = textareaRef.value;

    if (formatType === "h1" || formatType === "h2") {
      const lineStart = currentValue.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = currentValue.indexOf("\n", start);
      const currentLine = currentValue.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
      const prefix = formatType === "h1" ? "# " : "## ";

      // Check if the line already starts with the prefix to toggle it off
      if (currentLine.startsWith(prefix)) {
        const newLine = currentLine.substring(prefix.length);
        const newText = `${currentValue.substring(0, lineStart)}${newLine}${currentValue.substring(
          lineEnd === -1 ? currentValue.length : lineEnd
        )}`;
        setCurrentContent(newText);
      } else {
        // Remove other header formats before adding the new one
        const cleanedLine = currentLine.replace(/^(#+\s)/, "");
        const newText = `${currentValue.substring(
          0,
          lineStart
        )}${prefix}${cleanedLine}${currentValue.substring(
          lineEnd === -1 ? currentValue.length : lineEnd
        )}`;
        setCurrentContent(newText);
      }
    } else if (formatType === "bulletList" || formatType === "orderedList") {
      const lineStart = currentValue.lastIndexOf("\n", start - 1) + 1;
      // Find the end of the full line(s) selected
      let lineEnd = currentValue.indexOf("\n", end);
      if (lineEnd === -1) lineEnd = currentValue.length;

      const selection = currentValue.substring(lineStart, lineEnd);
      const lines = selection.split("\n");
      let newLines: string[] = [];

      if (formatType === "bulletList") {
        const isBulleted = lines.every((line) => /^\s*-\s/.test(line));
        if (isBulleted) {
          newLines = lines.map((line) => line.replace(/^\s*-\s?/, ""));
        } else {
          newLines = lines.map((line) => (line.trim() === "" ? "" : `- ${line}`));
        }
      } else {
        // orderedList
        const isNumbered = lines.every((line) => /^\s*\d+\.\s/.test(line));
        if (isNumbered) {
          newLines = lines.map((line) => line.replace(/^\s*\d+\.\s?/, ""));
        } else {
          let count = 1;
          newLines = lines.map((line) => {
            if (line.trim() === "") return "";
            return `${count++}. ${line}`;
          });
        }
      }

      const newSelection = newLines.join("\n");
      const newText = `${currentValue.substring(
        0,
        lineStart
      )}${newSelection}${currentValue.substring(lineEnd)}`;
      setCurrentContent(newText);
    }
  };

  const parsedContent = createMemo(() => {
    return marked(currentContent());
  });

  return (
    <Show
      when={chapterStore.selectedChapter()}
      fallback={
        <div class="flex items-center justify-center h-full text-gray-500">
          Select a chapter to start editing.
        </div>
      }
    >
      <div class="flex flex-col h-full">
        <div class="p-2 border-b border-gray-300 bg-gray-50 mb-2 rounded-t-md flex items-center justify-between">
          {/* Toolbar */}
          <div class="flex items-center space-x-2">
            <Show when={mode() === "edit"}>
              <span class="font-semibold text-gray-700 mr-2">Toolbar:</span>
              <button
                onClick={() => applyFormat("bold")}
                class="px-2 py-1 text-sm font-bold hover:bg-gray-200 rounded"
              >
                B
              </button>
              <button
                onClick={() => applyFormat("italic")}
                class="px-2 py-1 text-sm italic hover:bg-gray-200 rounded"
              >
                I
              </button>
              <button
                onClick={() => applyFormat("h1")}
                class="px-2 py-1 text-sm font-semibold hover:bg-gray-200 rounded"
              >
                H1
              </button>
              <button
                onClick={() => applyFormat("h2")}
                class="px-2 py-1 text-sm font-semibold hover:bg-gray-200 rounded"
              >
                H2
              </button>
              <button
                onClick={() => applyFormat("bulletList")}
                class="px-2 py-1 text-sm font-semibold hover:bg-gray-200 rounded"
              >
                Bullets
              </button>
              <button
                onClick={() => applyFormat("orderedList")}
                class="px-2 py-1 text-sm font-semibold hover:bg-gray-200 rounded"
              >
                Ordered
              </button>
              <button
                onClick={() => applyFormat("code")}
                class="px-2 py-1 text-sm font-mono hover:bg-gray-200 rounded"
              >
                Code
              </button>
            </Show>
          </div>
          {/* Mode Toggle */}
          <div class="flex items-center">
            <button
              onClick={() => setMode("edit")}
              class={`px-3 py-1 text-sm rounded-l-md ${
                mode() === "edit" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setMode("preview")}
              class={`px-3 py-1 text-sm rounded-r-md ${
                mode() === "preview" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {/* Editor or Preview Pane */}
        <div class="flex-grow flex flex-col p-4 border border-gray-300 rounded-b-md bg-white overflow-y-auto">
          <h1 class="text-2xl font-bold mb-4 border-b pb-2 flex-shrink-0">
            {chapterStore.selectedChapter()?.title || "Loading..."}
          </h1>
          <Show
            when={mode() === "edit"}
            fallback={<div class="prose max-w-none" innerHTML={parsedContent()} />}
          >
            <textarea
              ref={textareaRef}
              class="flex-grow w-full p-2 border-none focus:ring-0 focus:outline-none resize-none"
              placeholder="Start typing your markdown here..."
              value={currentContent()}
              onInput={(e) => setCurrentContent(e.currentTarget.value)}
            />
          </Show>
        </div>
        <div class="mt-auto pt-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving()}
            class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving() ? "Saving..." : "Save Chapter"}
          </button>
        </div>
      </div>
    </Show>
  );
};

export default EditorArea;
