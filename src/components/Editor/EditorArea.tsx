import { Component, createEffect, createSignal, Show, createMemo } from "solid-js";
import { chapterStore } from "../../stores/chapterStore";
import { Chapter } from "../../stores/types";
import { marked } from "marked";
import { settingsStore } from "../../stores/settingsStore";
import { editorStore } from "../../stores/editorStore";
import "../../styles/themes.css";

// Optional: Add Tailwind's typography plugin for better preview styling
// npm install -D @tailwindcss/typography
// Then add `require('@tailwindcss/typography')` to plugins in tailwind.config.js
// The 'prose' class used below will then be available.

const EditorArea: Component = () => {
  const [currentContent, setCurrentContent] = createSignal("");
  const [isSaving, setIsSaving] = createSignal(false);
  let textareaRef: HTMLTextAreaElement | undefined;
  let editableRef: HTMLDivElement | undefined;

  createEffect(() => {
    const chapter = chapterStore.selectedChapter();
    if (chapter) {
      setCurrentContent(chapter.content);
    } else {
      setCurrentContent("");
    }
  });

  // Listen for save events from the toolbar
  createEffect(() => {
    const handleSaveEvent = () => {
      handleSave();
    };

    window.addEventListener("triggerSave", handleSaveEvent);

    return () => {
      window.removeEventListener("triggerSave", handleSaveEvent);
    };
  });

  // Save functionality
  const handleSave = async () => {
    const chapter = chapterStore.selectedChapter();
    if (!chapter) return;

    setIsSaving(true);
    try {
      await chapterStore.updateChapter(chapter.id, { content: currentContent() });
      // Show success message for manual saves
      if (!settingsStore.settings.autoSave) {
        alert("Chapter saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save chapter:", error);
      alert("Failed to save chapter.");
    } finally {
      setIsSaving(false);
    }
  };

  // Autosave functionality - only triggers if autosave is enabled
  const handleAutoSave = async () => {
    if (!settingsStore.settings.autoSave) return;
    await handleSave();
  };

  const toggleFormat = (wrapChar: string) => {
    const activeRef = editorStore.mode() === "code" ? textareaRef : null;
    if (!activeRef) return;

    const start = activeRef.selectionStart;
    const end = activeRef.selectionEnd;
    const selectedText = activeRef.value.substring(start, end);
    const currentValue = activeRef.value;

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
        activeRef?.focus();
        activeRef?.setSelectionRange(start - wrapChar.length, end - wrapChar.length);
      }, 0);
    } else {
      // Wrap
      const newText = `${before}${wrapChar}${selectedText}${wrapChar}${after}`;
      setCurrentContent(newText);
      setTimeout(() => {
        activeRef?.focus();
        activeRef?.setSelectionRange(start + wrapChar.length, end + wrapChar.length);
      }, 0);
    }
  };

  const applyFormat = (
    formatType:
      | "bold"
      | "italic"
      | "h1"
      | "h2"
      | "h3"
      | "bulletList"
      | "orderedList"
      | "code"
      | "strikethrough"
      | "blockquote"
      | "link"
      | "clear"
  ) => {
    if (editorStore.mode() === "write") {
      // In write mode, we'll apply formatting by modifying the markdown and re-rendering
      applyFormatToMarkdown(formatType);
    } else {
      // In code mode, use the existing logic
      applyFormatToTextarea(formatType);
    }
  };

  const applyFormatToMarkdown = (formatType: string) => {
    // For write mode, we'll work directly with the markdown content
    // but check the current state in the contentEditable element
    if (!editableRef) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const currentMarkdown = currentContent();

    // For heading formats, we need to work with the entire line
    if (formatType === "h1" || formatType === "h2" || formatType === "h3") {
      const selectedText = selection.toString();
      if (!selectedText) return;

      // Find the line containing the selected text
      const lines = currentMarkdown.split("\n");
      let targetLineIndex = -1;
      let targetLine = "";

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(selectedText)) {
          targetLineIndex = i;
          targetLine = lines[i];
          break;
        }
      }

      if (targetLineIndex === -1) return;

      const prefix = formatType === "h1" ? "# " : formatType === "h2" ? "## " : "### ";

      // Check if the line already starts with the prefix to toggle it off
      if (targetLine.startsWith(prefix)) {
        lines[targetLineIndex] = targetLine.substring(prefix.length);
      } else {
        // Remove other header formats before adding the new one
        const cleanedLine = targetLine.replace(/^(#+\s)/, "");
        lines[targetLineIndex] = `${prefix}${cleanedLine}`;
      }

      const newMarkdown = lines.join("\n");
      setCurrentContent(newMarkdown);
      return;
    }

    // For other formats, work with selected text
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Check if the selected text is already formatted in the markdown
    const isAlreadyFormatted = (text: string, format: string) => {
      switch (format) {
        case "bold":
          return currentMarkdown.includes(`**${text}**`);
        case "italic":
          return currentMarkdown.includes(`*${text}*`) && !currentMarkdown.includes(`**${text}**`);
        case "strikethrough":
          return currentMarkdown.includes(`~~${text}~~`);
        case "code":
          return currentMarkdown.includes(`\`${text}\``);
        default:
          return false;
      }
    };

    let newMarkdown = currentMarkdown;

    switch (formatType) {
      case "bold":
        if (isAlreadyFormatted(selectedText, "bold")) {
          // Remove bold formatting
          newMarkdown = newMarkdown.replace(`**${selectedText}**`, selectedText);
        } else {
          // Add bold formatting
          newMarkdown = newMarkdown.replace(selectedText, `**${selectedText}**`);
        }
        break;

      case "italic":
        if (isAlreadyFormatted(selectedText, "italic")) {
          // Remove italic formatting
          newMarkdown = newMarkdown.replace(`*${selectedText}*`, selectedText);
        } else {
          // Add italic formatting
          newMarkdown = newMarkdown.replace(selectedText, `*${selectedText}*`);
        }
        break;

      case "strikethrough":
        if (isAlreadyFormatted(selectedText, "strikethrough")) {
          // Remove strikethrough formatting
          newMarkdown = newMarkdown.replace(`~~${selectedText}~~`, selectedText);
        } else {
          // Add strikethrough formatting
          newMarkdown = newMarkdown.replace(selectedText, `~~${selectedText}~~`);
        }
        break;

      case "code":
        if (isAlreadyFormatted(selectedText, "code")) {
          // Remove code formatting
          newMarkdown = newMarkdown.replace(`\`${selectedText}\``, selectedText);
        } else {
          // Add code formatting
          newMarkdown = newMarkdown.replace(selectedText, `\`${selectedText}\``);
        }
        break;

      case "blockquote":
        // Find the line containing the selected text
        const lines = currentMarkdown.split("\n");
        let targetLineIndex = -1;
        let targetLine = "";

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(selectedText)) {
            targetLineIndex = i;
            targetLine = lines[i];
            break;
          }
        }

        if (targetLineIndex !== -1) {
          if (targetLine.startsWith("> ")) {
            lines[targetLineIndex] = targetLine.substring(2);
          } else {
            lines[targetLineIndex] = `> ${targetLine}`;
          }
          newMarkdown = lines.join("\n");
        }
        break;

      case "bulletList":
        // Find lines containing the selected text
        const bulletLines = currentMarkdown.split("\n");
        const selectedLines = [];

        for (let i = 0; i < bulletLines.length; i++) {
          if (bulletLines[i].includes(selectedText)) {
            selectedLines.push(i);
          }
        }

        if (selectedLines.length > 0) {
          const isBulleted = selectedLines.every((i) => /^\s*-\s/.test(bulletLines[i]));

          selectedLines.forEach((i) => {
            if (isBulleted) {
              bulletLines[i] = bulletLines[i].replace(/^\s*-\s?/, "");
            } else {
              bulletLines[i] = bulletLines[i].trim() === "" ? "" : `- ${bulletLines[i]}`;
            }
          });

          newMarkdown = bulletLines.join("\n");
        }
        break;

      case "orderedList":
        // Find lines containing the selected text
        const orderedLines = currentMarkdown.split("\n");
        const selectedOrderedLines = [];

        for (let i = 0; i < orderedLines.length; i++) {
          if (orderedLines[i].includes(selectedText)) {
            selectedOrderedLines.push(i);
          }
        }

        if (selectedOrderedLines.length > 0) {
          const isNumbered = selectedOrderedLines.every((i) => /^\s*\d+\.\s/.test(orderedLines[i]));

          if (isNumbered) {
            selectedOrderedLines.forEach((i) => {
              orderedLines[i] = orderedLines[i].replace(/^\s*\d+\.\s?/, "");
            });
          } else {
            let count = 1;
            selectedOrderedLines.forEach((i) => {
              if (orderedLines[i].trim() !== "") {
                orderedLines[i] = `${count++}. ${orderedLines[i]}`;
              }
            });
          }

          newMarkdown = orderedLines.join("\n");
        }
        break;

      case "link":
        const linkText = selectedText || "link text";
        const linkFormat = `[${linkText}](url)`;
        newMarkdown = newMarkdown.replace(selectedText, linkFormat);
        break;

      case "clear":
        // For clear formatting, we need to work with the entire markdown content
        // and clean all lines that contain the selected text
        const clearLines = currentMarkdown.split("\n");
        let hasChanges = false;

        for (let i = 0; i < clearLines.length; i++) {
          if (clearLines[i].includes(selectedText)) {
            const originalLine = clearLines[i];
            let cleanedLine = originalLine;

            // Remove all markdown formatting from this line
            cleanedLine = cleanedLine.replace(/\*\*(.*?)\*\*/g, "$1"); // Remove bold
            cleanedLine = cleanedLine.replace(/\*(.*?)\*/g, "$1"); // Remove italic
            cleanedLine = cleanedLine.replace(/~~(.*?)~~/g, "$1"); // Remove strikethrough
            cleanedLine = cleanedLine.replace(/`(.*?)`/g, "$1"); // Remove inline code
            cleanedLine = cleanedLine.replace(/\[(.*?)\]\(.*?\)/g, "$1"); // Remove links
            cleanedLine = cleanedLine.replace(/^#{1,6}\s/, ""); // Remove headers
            cleanedLine = cleanedLine.replace(/^>\s?/, ""); // Remove blockquotes
            cleanedLine = cleanedLine.replace(/^[-*+]\s/, ""); // Remove bullet lists
            cleanedLine = cleanedLine.replace(/^\d+\.\s/, ""); // Remove ordered lists

            if (cleanedLine !== originalLine) {
              clearLines[i] = cleanedLine;
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          newMarkdown = clearLines.join("\n");
        }
        break;
    }

    if (newMarkdown !== currentMarkdown) {
      // Save selection before updating content
      const range = selection.getRangeAt(0);
      const startOffset = range.startOffset;
      const endOffset = range.endOffset;
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;

      setCurrentContent(newMarkdown);

      // Restore selection after content update
      setTimeout(() => {
        try {
          if (document.contains(startContainer) && document.contains(endContainer)) {
            const newRange = document.createRange();
            newRange.setStart(startContainer, startOffset);
            newRange.setEnd(endContainer, endOffset);
            selection.removeAllRanges();
            selection.addRange(newRange);
          } else {
            // Fallback: try to select the same text in the new content
            const textToSelect = selectedText;
            if (editableRef && textToSelect) {
              const walker = document.createTreeWalker(editableRef, NodeFilter.SHOW_TEXT, null);

              let node;
              while ((node = walker.nextNode())) {
                const textNode = node as Text;
                const text = textNode.textContent || "";
                const index = text.indexOf(textToSelect);

                if (index !== -1) {
                  const newRange = document.createRange();
                  newRange.setStart(textNode, index);
                  newRange.setEnd(textNode, index + textToSelect.length);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.warn("Could not restore selection after formatting:", error);
        }
      }, 0);
    }
  };

  const applyFormatToTextarea = (
    formatType:
      | "bold"
      | "italic"
      | "h1"
      | "h2"
      | "h3"
      | "bulletList"
      | "orderedList"
      | "code"
      | "strikethrough"
      | "blockquote"
      | "link"
      | "clear"
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
    if (formatType === "strikethrough") {
      toggleFormat("~~");
      return;
    }

    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    const currentValue = textareaRef.value;

    if (formatType === "clear") {
      // Clear formatting from selected text
      const selectedText = currentValue.substring(start, end);
      const cleanedText = selectedText
        .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
        .replace(/\*(.*?)\*/g, "$1") // Remove italic
        .replace(/~~(.*?)~~/g, "$1") // Remove strikethrough
        .replace(/`(.*?)`/g, "$1") // Remove inline code
        .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
        .replace(/^#{1,6}\s/gm, "") // Remove headers
        .replace(/^>\s?/gm, "") // Remove blockquotes
        .replace(/^[-*+]\s/gm, "") // Remove bullet lists
        .replace(/^\d+\.\s/gm, ""); // Remove ordered lists

      const newText = currentValue.substring(0, start) + cleanedText + currentValue.substring(end);
      setCurrentContent(newText);
      setTimeout(() => {
        textareaRef?.focus();
        textareaRef?.setSelectionRange(start, start + cleanedText.length);
      }, 0);
      return;
    }

    if (formatType === "link") {
      const selectedText = currentValue.substring(start, end);
      const linkText = selectedText || "link text";
      const linkFormat = `[${linkText}](url)`;
      const newText = currentValue.substring(0, start) + linkFormat + currentValue.substring(end);
      setCurrentContent(newText);
      setTimeout(() => {
        textareaRef?.focus();
        // Select the "url" part for easy editing
        const urlStart = start + linkText.length + 3;
        textareaRef?.setSelectionRange(urlStart, urlStart + 3);
      }, 0);
      return;
    }

    if (formatType === "blockquote") {
      const lineStart = currentValue.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = currentValue.indexOf("\n", start);
      const currentLine = currentValue.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);

      if (currentLine.startsWith("> ")) {
        const newLine = currentLine.substring(2);
        const newText = `${currentValue.substring(0, lineStart)}${newLine}${currentValue.substring(
          lineEnd === -1 ? currentValue.length : lineEnd
        )}`;
        setCurrentContent(newText);
      } else {
        const newText = `${currentValue.substring(
          0,
          lineStart
        )}> ${currentLine}${currentValue.substring(
          lineEnd === -1 ? currentValue.length : lineEnd
        )}`;
        setCurrentContent(newText);
      }
      return;
    }

    if (formatType === "h1" || formatType === "h2" || formatType === "h3") {
      const lineStart = currentValue.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = currentValue.indexOf("\n", start);
      const currentLine = currentValue.substring(lineStart, lineEnd === -1 ? undefined : lineEnd);
      const prefix = formatType === "h1" ? "# " : formatType === "h2" ? "## " : "### ";

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

  // Track if we're currently updating from user input to prevent cursor jumps
  const [isUserEditing, setIsUserEditing] = createSignal(false);
  const [lastRenderedContent, setLastRenderedContent] = createSignal("");

  const handleEditableInput = (e: Event) => {
    const target = e.target as HTMLDivElement;
    setIsUserEditing(true);

    // Convert HTML back to markdown using a proper converter
    const markdown = htmlToMarkdown(target.innerHTML);
    setCurrentContent(markdown);
  };

  // Convert HTML back to markdown - proper implementation
  const htmlToMarkdown = (html: string): string => {
    // Create a temporary div to parse HTML
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Helper function to process text nodes and maintain markdown formatting
    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();
        const children = Array.from(element.childNodes).map(processNode).join("");

        switch (tagName) {
          case "h1":
            return `# ${children}\n\n`;
          case "h2":
            return `## ${children}\n\n`;
          case "h3":
            return `### ${children}\n\n`;
          case "h4":
            return `#### ${children}\n\n`;
          case "h5":
            return `##### ${children}\n\n`;
          case "h6":
            return `###### ${children}\n\n`;

          case "strong":
          case "b":
            return `**${children}**`;

          case "em":
          case "i":
            return `*${children}*`;

          case "del":
          case "s":
            return `~~${children}~~`;

          case "code":
            // Only wrap with backticks if it's not already wrapped
            if (!children.startsWith("`") && !children.endsWith("`")) {
              return `\`${children}\``;
            }
            return children;

          case "pre":
            // Handle code blocks
            const codeElement = element.querySelector("code");
            if (codeElement) {
              return `\n\`\`\`\n${codeElement.textContent || ""}\n\`\`\`\n\n`;
            }
            return `\n\`\`\`\n${children}\n\`\`\`\n\n`;

          case "blockquote":
            return (
              children
                .split("\n")
                .map((line) => (line.trim() ? `> ${line}` : ">"))
                .join("\n") + "\n\n"
            );

          case "ul":
            return children + "\n";

          case "ol":
            return children + "\n";

          case "li":
            const parent = element.parentElement;
            if (parent?.tagName.toLowerCase() === "ol") {
              // For ordered lists, we need to find the index
              const siblings = Array.from(parent.children);
              const index = siblings.indexOf(element) + 1;
              return `${index}. ${children}\n`;
            } else {
              // Unordered list
              return `- ${children}\n`;
            }

          case "a":
            const href = element.getAttribute("href");
            if (href) {
              return `[${children}](${href})`;
            }
            return children;

          case "br":
            return "\n";

          case "p":
            return `${children}\n\n`;

          case "div":
            // For div elements, just return children with proper spacing
            return children + (children.endsWith("\n") ? "" : "\n");

          default:
            // For unknown elements, just return the children
            return children;
        }
      }

      return "";
    };

    const markdown = processNode(temp);

    // Clean up extra newlines and whitespace
    return markdown
      .replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with 2
      .replace(/^\n+|\n+$/g, "") // Remove leading/trailing newlines
      .trim();
  };

  // Save and restore cursor position
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (!selection || !editableRef || selection.rangeCount === 0) return null;

    try {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editableRef);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString().length;
    } catch (error) {
      console.warn("Could not save cursor position:", error);
      return null;
    }
  };

  const restoreCursorPosition = (position: number) => {
    if (!editableRef) return;

    const selection = window.getSelection();
    if (!selection) return;

    try {
      let charIndex = 0;
      const walker = document.createTreeWalker(editableRef, NodeFilter.SHOW_TEXT, null);

      let node;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const nextCharIndex = charIndex + textNode.textContent!.length;

        if (position <= nextCharIndex) {
          const range = document.createRange();
          const offset = Math.min(position - charIndex, textNode.textContent!.length);

          // Ensure the text node is still in the document
          if (document.contains(textNode)) {
            range.setStart(textNode, offset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            // Fallback: place cursor at the end of the editable element
            try {
              const fallbackRange = document.createRange();
              fallbackRange.selectNodeContents(editableRef);
              fallbackRange.collapse(false);
              selection.removeAllRanges();
              selection.addRange(fallbackRange);
            } catch (fallbackError) {
              console.warn("Could not set fallback cursor position:", fallbackError);
            }
          }
          break;
        }
        charIndex = nextCharIndex;
      }
    } catch (error) {
      console.warn("Could not restore cursor position:", error);
      // Fallback: try to place cursor at the end
      try {
        const range = document.createRange();
        range.selectNodeContents(editableRef);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (fallbackError) {
        console.warn("Could not set fallback cursor position:", fallbackError);
      }
    }
  };

  // Update content only when switching modes or when content changes externally
  createEffect(() => {
    const content = currentContent();
    if (!isUserEditing() && content !== lastRenderedContent()) {
      if (editableRef) {
        editableRef.innerHTML = marked(content);
        // Don't try to restore cursor position after innerHTML updates
        // Let the user click where they want to continue editing
      }
      setLastRenderedContent(content);
    }
  });

  return (
    <Show
      when={chapterStore.selectedChapter()}
      fallback={
        <div class="flex items-center justify-center h-full theme-text-muted">
          <div class="text-center p-8">
            <div class="text-6xl mb-4">📖</div>
            <p class="font-medium text-lg theme-text-secondary">
              Select a chapter to start writing
            </p>
            <p class="text-sm theme-text-muted mt-2">Your story awaits...</p>
          </div>
        </div>
      }
    >
      <div class="flex justify-center h-full">
        {/* Dynamic paragraph padding style */}
        <style>{`.prose-clean p { padding-bottom: ${editorStore.paddingSize()} !important; }`}</style>
        <div
          style={
            editorStore.textSize() === "960px"
              ? { width: "100%", "max-width": "960px" }
              : {
                  width: `${editorStore.textSize()}%`,
                  "max-width":
                    editorStore.textSize() === 100 ? "none" : `${editorStore.textSize()}%`,
                }
          }
          class="flex flex-col h-full"
        >
          {/* Enhanced Toolbar */}
          <div class="p-3 theme-border-secondary border-b">
            <div class="flex items-center justify-center">
              {/* Formatting Tools - Always Available */}
              <div class="flex items-center space-x-1">
                <span class="theme-text-tertiary text-xs font-medium mr-2">Format:</span>

                {/* Text Formatting */}
                <button
                  onClick={() => applyFormat("bold")}
                  class="px-2 py-1 text-xs font-bold theme-btn-secondary transition-colors"
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => applyFormat("italic")}
                  class="px-2 py-1 text-xs italic theme-btn-secondary transition-colors"
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => applyFormat("strikethrough")}
                  class="px-2 py-1 text-xs theme-btn-secondary transition-colors line-through"
                  title="Strikethrough"
                >
                  S
                </button>

                <div class="w-px h-4 theme-border-primary bg-current mx-1"></div>

                {/* Headers */}
                <button
                  onClick={() => applyFormat("h1")}
                  class="px-2 py-1 text-xs font-bold theme-btn-secondary transition-colors"
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  onClick={() => applyFormat("h2")}
                  class="px-2 py-1 text-xs font-semibold theme-btn-secondary transition-colors"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  onClick={() => applyFormat("h3")}
                  class="px-2 py-1 text-xs font-medium theme-btn-secondary transition-colors"
                  title="Heading 3"
                >
                  H3
                </button>

                <div class="w-px h-4 theme-border-primary bg-current mx-1"></div>

                {/* Lists */}
                <button
                  onClick={() => applyFormat("bulletList")}
                  class="px-2 py-1 text-xs theme-btn-secondary transition-colors"
                  title="Bullet List"
                >
                  •
                </button>
                <button
                  onClick={() => applyFormat("orderedList")}
                  class="px-2 py-1 text-xs theme-btn-secondary transition-colors"
                  title="Numbered List"
                >
                  1.
                </button>

                <div class="w-px h-4 theme-border-primary bg-current mx-1"></div>

                {/* Special Formatting */}
                <button
                  onClick={() => applyFormat("code")}
                  class="px-2 py-1 text-xs font-mono theme-btn-secondary transition-colors"
                  title="Inline Code"
                >
                  &lt;/&gt;
                </button>
                <button
                  onClick={() => applyFormat("blockquote")}
                  class="px-2 py-1 text-xs theme-btn-secondary transition-colors"
                  title="Quote"
                >
                  "
                </button>
                <button
                  onClick={() => applyFormat("link")}
                  class="px-2 py-1 text-xs theme-btn-secondary transition-colors"
                  title="Link"
                >
                  🔗
                </button>

                <div class="w-px h-4 theme-border-primary bg-current mx-1"></div>

                {/* Clear Formatting */}
                <button
                  onClick={() => applyFormat("clear")}
                  class="px-2 py-1 text-xs theme-btn-secondary transition-colors"
                  title="Clear Formatting"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div class="writing-editor-container flex-grow overflow-hidden flex flex-col">
            <Show
              when={editorStore.mode() === "write"}
              fallback={
                /* Code Mode - Raw Markdown */
                <textarea
                  ref={textareaRef}
                  class="code-editor h-full w-full p-4 resize-none font-mono text-sm theme-text-primary leading-relaxed overflow-auto"
                  placeholder="# Start writing your markdown here..."
                  value={currentContent()}
                  onInput={(e) => setCurrentContent(e.currentTarget.value)}
                  onBlur={handleAutoSave}
                  style={{
                    border: "none",
                    outline: "none",
                    "font-size": `${editorStore.fontSize()}px`,
                  }}
                />
              }
            >
              {/* Write Mode - Editable Rendered Markdown */}
              <div
                ref={(el) => {
                  editableRef = el;
                  if (el) {
                    el.innerHTML = marked(currentContent());
                  }
                }}
                contentEditable={true}
                class="writing-editor h-full w-full p-4 resize-none prose prose-lg max-w-none typewriter-text prose-clean theme-text-primary leading-relaxed overflow-auto"
                onInput={handleEditableInput}
                onFocus={() => setIsUserEditing(true)}
                onBlur={() => {
                  setTimeout(() => setIsUserEditing(false), 100);
                  handleAutoSave();
                }}
                style={{
                  border: "none",
                  outline: "none",
                  "font-size": `${editorStore.fontSize()}px`,
                }}
              />
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default EditorArea;
