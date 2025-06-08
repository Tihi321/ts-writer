import { Component, For, Show } from "solid-js";
import { bookStore } from "../../stores/bookStore";
import { BookSummary } from "../../services/bookManager";

interface LoadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoadBookModal: Component<LoadBookModalProps> = (props) => {
  const handleSelectBook = (book: BookSummary) => {
    bookStore.selectBookById(book.id);
    props.onClose();
  };

  const getSyncStatusIcon = (status: BookSummary["syncStatus"]) => {
    switch (status) {
      case "in_sync":
        return "✅";
      case "out_of_sync":
        return "⚠️";
      case "local_only":
        return "💾";
      case "cloud_only":
        return "☁️";
      default:
        return "⏱️";
    }
  };

  const getSyncStatusText = (status: BookSummary["syncStatus"]) => {
    switch (status) {
      case "in_sync":
        return "In Sync";
      case "out_of_sync":
        return "Out of Sync";
      case "local_only":
        return "Local Only";
      case "cloud_only":
        return "Cloud Only";
      default:
        return "Unknown";
    }
  };

  const getSourceBadgeClass = (source: BookSummary["source"]) => {
    switch (source) {
      case "local":
        return "bg-blue-100 text-blue-800";
      case "cloud":
        return "bg-purple-100 text-purple-800";
      case "imported":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
          {/* Header */}
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-900">Load Book</h2>
            <button
              onClick={props.onClose}
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div class="p-6">
            <Show
              when={bookStore.books().length > 0}
              fallback={
                <div class="text-center py-8">
                  <div class="text-gray-400 text-4xl mb-4">📚</div>
                  <p class="text-gray-500">No books found</p>
                  <p class="text-sm text-gray-400 mt-2">Create your first book to get started</p>
                </div>
              }
            >
              <div class="space-y-2">
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Select a book to open:
                </label>
                <div class="max-h-64 overflow-y-auto space-y-2">
                  <For each={bookStore.books()}>
                    {(book) => (
                      <button
                        onClick={() => handleSelectBook(book)}
                        class={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          bookStore.selectedBookId() === book.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div class="flex items-center space-x-3">
                          <div class="text-blue-600">📖</div>
                          <div class="flex-1">
                            <p class="font-medium text-gray-900">{book.name}</p>
                            <div class="flex items-center gap-2 mt-1">
                              <span class="text-xs">{getSyncStatusIcon(book.syncStatus)}</span>
                              <span class="text-xs text-gray-600">
                                {getSyncStatusText(book.syncStatus)}
                              </span>
                              <span
                                class={`px-2 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeClass(
                                  book.source
                                )}`}
                              >
                                {book.source}
                              </span>
                            </div>
                            <div class="text-xs text-gray-500 mt-1">
                              Modified: {new Date(book.localLastModified).toLocaleDateString()}
                            </div>
                          </div>
                          <div class="text-gray-400">
                            <svg
                              class="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <Show when={bookStore.loading()}>
              <div class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b border-blue-600 mx-auto mb-4"></div>
                <p class="text-gray-500">Loading books...</p>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div class="flex items-center justify-between p-6 border-t border-gray-200">
            <div class="text-sm text-gray-500">
              {bookStore.books().length} book{bookStore.books().length !== 1 ? "s" : ""} available
            </div>
            <button
              onClick={props.onClose}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default LoadBookModal;
