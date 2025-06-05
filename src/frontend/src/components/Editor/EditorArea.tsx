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
        <div class="flex items-center justify-center h-full text-gray-500 bg-white">
          <div class="text-center p-8">
            <div class="text-6xl mb-4">📖</div>
            <p class="font-medium text-lg text-gray-700">Select a chapter to start writing</p>
            <p class="text-sm text-gray-500 mt-2">Your story awaits...</p>
          </div>
        </div>
      }
    >
      <div class="flex flex-col h-full bg-white">
        {/* Clean Toolbar */}
        <div class="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <Show when={mode() === "edit"}>
              <div class="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                <span class="text-gray-700 text-sm font-medium">Format:</span>
                <button
                  onClick={() => applyFormat("bold")}
                  class="px-3 py-1 text-sm font-bold hover:bg-gray-100 rounded border border-gray-200 bg-white transition-colors"
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>
                <button
                  onClick={() => applyFormat("italic")}
                  class="px-3 py-1 text-sm italic hover:bg-gray-100 rounded border border-gray-200 bg-white transition-colors"
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
                <button
                  onClick={() => applyFormat("h1")}
                  class="px-3 py-1 text-sm font-bold hover:bg-gray-100 rounded border border-gray-200 bg-white transition-colors"
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  onClick={() => applyFormat("h2")}
                  class="px-3 py-1 text-sm font-semibold hover:bg-gray-100 rounded border border-gray-200 bg-white transition-colors"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  onClick={() => applyFormat("bulletList")}
                  class="px-3 py-1 text-sm hover:bg-gray-100 rounded border border-gray-200 bg-white transition-colors"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  onClick={() => applyFormat("orderedList")}
                  class="px-3 py-1 text-sm hover:bg-gray-100 rounded border border-gray-200 bg-white transition-colors"
                  title="Numbered List"
                >
                  1. List
                </button>
                <button
                  onClick={() => applyFormat("code")}
                  class="px-3 py-1 text-sm font-mono hover:bg-gray-100 rounded border border-gray-200 bg-white transition-colors"
                  title="Code"
                >
                  &lt;/&gt;
                </button>
              </div>
            </Show>
          </div>

          {/* Mode Toggle */}
          <div class="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <button
              onClick={() => setMode("edit")}
              class={`px-4 py-2 text-sm font-medium transition-colors ${
                mode() === "edit"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setMode("preview")}
              class={`px-4 py-2 text-sm font-medium transition-colors ${
                mode() === "preview"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              👁️ Preview
            </button>
          </div>
        </div>

        {/* Editor/Preview Area */}
        <div class="flex-grow flex flex-col p-6 bg-white overflow-y-auto">
          <h1 class="text-3xl font-bold mb-6 text-gray-900 border-b border-gray-200 pb-3">
            {chapterStore.selectedChapter()?.title || "Loading..."}
          </h1>

          <Show
            when={mode() === "edit"}
            fallback={
              <div
                class="prose prose-lg max-w-none typewriter-text prose-clean"
                innerHTML={parsedContent()}
              />
            }
          >
            <textarea
              ref={textareaRef}
              class="flex-grow w-full p-4 border-none focus:ring-0 focus:outline-none resize-none bg-transparent typewriter-text text-gray-800 text-lg leading-relaxed typewriter-cursor"
              placeholder="Start writing your story..."
              value={currentContent()}
              onInput={(e) => setCurrentContent(e.currentTarget.value)}
              style={{
                "background-image": "linear-gradient(transparent 1.4em, #f3f4f6 1.4em)",
                "background-size": "100% 1.5em",
                "line-height": "1.5em",
              }}
            />
          </Show>
        </div>

        {/* Save Button */}
        <div class="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving()}
            class="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm"
          >
            {isSaving() ? "💾 Saving..." : "💾 Save Chapter"}
          </button>
        </div>
      </div>
    </Show>
  );
};

export default EditorArea;
