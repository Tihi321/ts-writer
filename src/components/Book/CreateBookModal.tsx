import { Component, createSignal, Show } from "solid-js";
import { bookStore } from "../../stores/bookStore";

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBookModal: Component<CreateBookModalProps> = (props) => {
  const [newBookName, setNewBookName] = createSignal("");
  const [isCreating, setIsCreating] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handleCreateBook = async () => {
    if (!newBookName().trim()) return;

    try {
      setIsCreating(true);
      setError(null);

      const bookName = newBookName().trim();
      const bookId = await bookStore.createBook(bookName);

      // Reset form and close modal
      setNewBookName("");
      props.onClose();

      // The bookStore.createBook already handles:
      // - Creating the book
      // - Refreshing the books list
      // - Auto-selecting the new book
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create book");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setNewBookName("");
    setError(null);
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50">
        <div class="bg-white w-full h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-900">Create New Book</h2>
            <button
              onClick={handleClose}
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
          <div class="p-6 flex-1 overflow-y-auto">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Book Title</label>
                <input
                  type="text"
                  class="w-full p-3 border border-gray-300 text-gray-900 focus:border-gray-500 focus:outline-none"
                  placeholder="Enter your book title..."
                  value={newBookName()}
                  onInput={(e) => setNewBookName(e.currentTarget.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleCreateBook()}
                  autofocus
                />
                <p class="text-xs text-gray-500 mt-1">
                  This will create a new local book. You can sync it to cloud later.
                </p>
              </div>

              <Show when={error()}>
                <div class="border border-gray-400 p-3">
                  <p class="text-sm text-gray-700">{error()}</p>
                </div>
              </Show>
            </div>
          </div>

          {/* Footer */}
          <div class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:text-gray-800 hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBook}
              disabled={!newBookName().trim() || isCreating()}
              class="px-4 py-2 text-sm font-medium border border-gray-600 text-gray-800 hover:text-gray-900 hover:border-gray-700 disabled:border-gray-400 disabled:text-gray-400 transition-colors"
            >
              {isCreating() ? (
                <div class="flex items-center space-x-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b border-gray-600"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                "Create Local Book"
              )}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default CreateBookModal;
