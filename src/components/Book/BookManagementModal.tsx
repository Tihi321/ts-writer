import { Component, createSignal, createEffect, For, Show } from "solid-js";
import { bookStore } from "../../stores/bookStore";
import { bookService } from "../../services/bookService";
import { BookSummary, CloudBookInfo } from "../../services/bookManager";

interface BookManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookManagementModal: Component<BookManagementModalProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<"local" | "cloud" | "available">("local");
  const [localBooks, setLocalBooks] = createSignal<BookSummary[]>([]);
  const [cloudBooks, setCloudBooks] = createSignal<BookSummary[]>([]);
  const [availableCloudBooks, setAvailableCloudBooks] = createSignal<CloudBookInfo[]>([]);
  const [loading, setLoading] = createSignal(false);
  const [newBookName, setNewBookName] = createSignal("");
  const [showCreateForm, setShowCreateForm] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = createSignal<{
    isOpen: boolean;
    book?: BookSummary;
    deleteFrom?: "local" | "cloud" | "both";
  }>({ isOpen: false });

  // Rename dialog state
  const [renameDialog, setRenameDialog] = createSignal<{
    isOpen: boolean;
    book?: BookSummary;
    newName: string;
  }>({ isOpen: false, newName: "" });

  const loadBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const [local, cloud, available] = await Promise.all([
        bookService.getLocalBooks(),
        bookService.getCloudBooks(),
        bookService.getAvailableCloudBooks(),
      ]);

      setLocalBooks(local);
      setCloudBooks(cloud);
      setAvailableCloudBooks(available);
    } catch (err) {
      console.error("Failed to load books:", err);
      setError("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  // Load books when modal opens
  createEffect(() => {
    if (props.isOpen) {
      loadBooks();
    }
  });

  const handleCreateBook = async () => {
    const name = newBookName().trim();
    if (!name) {
      setError("Please enter a book name");
      return;
    }

    try {
      setError(null);
      const bookId = await bookStore.createBook(name);
      setNewBookName("");
      setShowCreateForm(false);
      await loadBooks();
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create book");
    }
  };

  const handleSelectBook = (book: BookSummary) => {
    bookStore.selectBookById(book.id);
    props.onClose();
  };

  const handleDeleteBook = async () => {
    const dialog = deleteDialog();
    if (!dialog.book || !dialog.deleteFrom) {
      setError("Please select a delete option");
      return;
    }

    try {
      setError(null);
      console.log("Deleting book:", dialog.book.id, "from:", dialog.deleteFrom);
      await bookStore.deleteBook(dialog.book.id, dialog.deleteFrom);
      setDeleteDialog({ isOpen: false });
      console.log("Delete successful, reloading books...");
      await loadBooks();
      console.log("Books reloaded");
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err instanceof Error ? err.message : "Failed to delete book");
    }
  };

  const handleRenameBook = async () => {
    const dialog = renameDialog();
    if (!dialog.book || !dialog.newName.trim()) return;

    try {
      await bookStore.renameBook(dialog.book.id, dialog.newName.trim());
      setRenameDialog({ isOpen: false, newName: "" });
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename book");
    }
  };

  const handleDuplicateBook = async (book: BookSummary) => {
    const newName = `${book.name} (Copy)`;
    try {
      await bookStore.duplicateBook(book.id, newName);
      await loadBooks();
    } catch (err) {
      setError("Failed to duplicate book");
    }
  };

  const handleSyncBook = async (book: BookSummary, direction: "push" | "pull") => {
    try {
      await bookService.syncBookWithCloud(book.id, direction);
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync book");
    }
  };

  const handleImportCloudBook = async (cloudBook: CloudBookInfo) => {
    try {
      await bookService.importCloudBook(cloudBook.id);
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import book");
    }
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

  const BookCard: Component<{ book: BookSummary }> = ({ book }) => {
    const [showMenu, setShowMenu] = createSignal(false);
    const isSelected = () => bookStore.selectedBookId() === book.id;

    return (
      <div
        class={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected() ? "ring-2 ring-blue-500 bg-blue-50" : "bg-white"
        }`}
      >
        <div class="flex items-start justify-between">
          <div class="flex-1" onClick={() => handleSelectBook(book)}>
            <h3 class="font-semibold text-lg text-gray-900">{book.name}</h3>
            <div class="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <span>{getSyncStatusIcon(book.syncStatus)}</span>
              <span>{getSyncStatusText(book.syncStatus)}</span>
              <span
                class={`px-2 py-1 rounded-full text-xs font-medium ${getSourceBadgeClass(
                  book.source
                )}`}
              >
                {book.source}
              </span>
            </div>
          </div>

          <div class="relative">
            <button
              onClick={() => setShowMenu(!showMenu())}
              class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 5v.01M12 12v.01M12 19v.01"
                />
              </svg>
            </button>

            <Show when={showMenu()}>
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <div class="py-1">
                  <button
                    onClick={() => {
                      handleSelectBook(book);
                      setShowMenu(false);
                    }}
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📖 Open Book
                  </button>
                  <button
                    onClick={() => {
                      setRenameDialog({ isOpen: true, book, newName: book.name });
                      setShowMenu(false);
                    }}
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    ✏️ Rename
                  </button>
                  <button
                    onClick={() => {
                      handleDuplicateBook(book);
                      setShowMenu(false);
                    }}
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    📋 Duplicate
                  </button>

                  <Show when={book.source !== "local"}>
                    <hr class="my-1" />
                    <button
                      onClick={() => {
                        handleSyncBook(book, "pull");
                        setShowMenu(false);
                      }}
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⬇️ Pull from Cloud
                    </button>
                    <button
                      onClick={() => {
                        handleSyncBook(book, "push");
                        setShowMenu(false);
                      }}
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⬆️ Push to Cloud
                    </button>
                  </Show>

                  <Show when={book.source === "local"}>
                    <hr class="my-1" />
                    <button
                      onClick={() => {
                        handleSyncBook(book, "push");
                        setShowMenu(false);
                      }}
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      ⬆️ Export to Cloud
                    </button>
                  </Show>

                  <hr class="my-1" />
                  <Show when={book.source === "local"}>
                    <button
                      onClick={() => {
                        setDeleteDialog({
                          isOpen: true,
                          book,
                          deleteFrom: "local",
                        });
                        setShowMenu(false);
                      }}
                      class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🗑️ Delete Book
                    </button>
                  </Show>

                  <Show when={book.source === "cloud" || book.source === "imported"}>
                    <button
                      onClick={() => {
                        setDeleteDialog({
                          isOpen: true,
                          book,
                          deleteFrom: "local",
                        });
                        setShowMenu(false);
                      }}
                      class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🗑️ Delete Book...
                    </button>
                  </Show>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <div class="mt-3 text-sm text-gray-500">
          <div>Version: {book.version}</div>
          <div>Modified: {new Date(book.localLastModified).toLocaleDateString()}</div>
          <Show when={book.cloudLastModified}>
            <div>Cloud: {new Date(book.cloudLastModified!).toLocaleDateString()}</div>
          </Show>
        </div>
      </div>
    );
  };

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div class="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 class="text-xl font-bold text-gray-900">Book Management</h2>
              <p class="text-sm text-gray-600 mt-1">
                Manage your local and cloud books. Use manual sync to push/pull individual books.
              </p>
            </div>
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

          {/* Tabs */}
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("local")}
                class={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab() === "local"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                💾 Local Books ({localBooks().length})
              </button>
              <button
                onClick={() => setActiveTab("cloud")}
                class={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab() === "cloud"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                ☁️ Cloud Books ({cloudBooks().length})
              </button>
              <button
                onClick={() => setActiveTab("available")}
                class={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab() === "available"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                ⬇️ Available ({availableCloudBooks().length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div class="p-6 overflow-auto max-h-[50vh]">
            <Show when={error()}>
              <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error()}
              </div>
            </Show>

            {/* Local Books Tab */}
            <Show when={activeTab() === "local"}>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">Local Books</h3>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    ➕ New Book
                  </button>
                </div>

                <Show when={showCreateForm()}>
                  <div class="border rounded-lg p-4 bg-gray-50">
                    <div class="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter book name..."
                        value={newBookName()}
                        onInput={(e) => setNewBookName(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateBook()}
                        class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleCreateBook}
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewBookName("");
                          setError(null);
                        }}
                        class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Show>

                <div class="grid gap-4">
                  <For each={localBooks()}>{(book) => <BookCard book={book} />}</For>
                  <Show when={localBooks().length === 0 && !loading()}>
                    <div class="text-center py-8 text-gray-500">
                      <div class="text-4xl mb-4">📚</div>
                      <p>No local books found. Create your first book!</p>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Cloud Books Tab */}
            <Show when={activeTab() === "cloud"}>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">Cloud Books</h3>
                  <button
                    onClick={loadBooks}
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>

                <div class="grid gap-4">
                  <For each={cloudBooks()}>{(book) => <BookCard book={book} />}</For>
                  <Show when={cloudBooks().length === 0 && !loading()}>
                    <div class="text-center py-8 text-gray-500">
                      <div class="text-4xl mb-4">☁️</div>
                      <p>No cloud books found.</p>
                      <p class="text-sm mt-2">
                        Import books from the Available tab or export local books to cloud.
                      </p>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Available Cloud Books Tab */}
            <Show when={activeTab() === "available"}>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold">Available Cloud Books</h3>
                  <button
                    onClick={loadBooks}
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                  >
                    🔄 Refresh
                  </button>
                </div>

                <div class="grid gap-4">
                  <For each={availableCloudBooks()}>
                    {(book) => (
                      <div class="border rounded-lg p-4 bg-white">
                        <div class="flex items-start justify-between">
                          <div>
                            <h3 class="font-semibold text-lg text-gray-900">{book.name}</h3>
                            <p class="text-sm text-gray-600 mt-1">
                              Version: {book.version} • Modified:{" "}
                              {new Date(book.lastModified).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleImportCloudBook(book)}
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                          >
                            ⬇️ Import
                          </button>
                        </div>
                      </div>
                    )}
                  </For>
                  <Show when={availableCloudBooks().length === 0 && !loading()}>
                    <div class="text-center py-8 text-gray-500">
                      <div class="text-4xl mb-4">📥</div>
                      <p>No books available for import.</p>
                      <p class="text-sm mt-2">Check your cloud connection.</p>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            <Show when={loading()}>
              <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b border-blue-600 mr-3"></div>
                <span class="text-gray-600">Loading books...</span>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Show when={deleteDialog().isOpen}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Delete Book</h3>
              <p class="text-gray-600 mb-4">
                Choose where to delete "{deleteDialog().book?.name}" from. This action cannot be
                undone.
              </p>

              {/* Warning for cloud deletions */}
              <Show
                when={deleteDialog().deleteFrom === "cloud" || deleteDialog().deleteFrom === "both"}
              >
                <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <div class="flex items-start">
                    <svg
                      class="w-5 h-5 text-yellow-600 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <div>
                      <p class="text-sm font-medium text-yellow-800">Warning: Cloud Deletion</p>
                      <p class="text-xs text-yellow-700 mt-1">
                        {deleteDialog().deleteFrom === "cloud"
                          ? "This will permanently remove the book from your cloud storage. You'll need to be signed in to Google Drive."
                          : "This will permanently remove the book from both your device and cloud storage. This action cannot be undone."}
                      </p>
                    </div>
                  </div>
                </div>
              </Show>

              {/* Delete options */}
              <div class="space-y-3 mb-6">
                <Show when={deleteDialog().book?.source === "local"}>
                  <div class="p-3 border rounded-lg bg-gray-50">
                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="delete-local-only"
                        name="deleteOption"
                        checked={deleteDialog().deleteFrom === "local"}
                        onChange={() =>
                          setDeleteDialog((prev) => ({ ...prev, deleteFrom: "local" }))
                        }
                        class="mr-3"
                      />
                      <label for="delete-local-only" class="text-sm font-medium text-gray-900">
                        💾 Delete from Local Storage Only
                      </label>
                    </div>
                    <p class="text-xs text-gray-600 ml-6">
                      Remove the book from this device only. (This is a local-only book)
                    </p>
                  </div>
                </Show>

                <Show
                  when={
                    deleteDialog().book?.source === "cloud" ||
                    deleteDialog().book?.source === "imported"
                  }
                >
                  <div class="p-3 border rounded-lg bg-gray-50">
                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="delete-local"
                        name="deleteOption"
                        checked={deleteDialog().deleteFrom === "local"}
                        onChange={() =>
                          setDeleteDialog((prev) => ({ ...prev, deleteFrom: "local" }))
                        }
                        class="mr-3"
                      />
                      <label for="delete-local" class="text-sm font-medium text-gray-900">
                        💾 Delete from Local Storage Only
                      </label>
                    </div>
                    <p class="text-xs text-gray-600 ml-6">
                      Remove the book from this device only. Cloud copy remains intact.
                    </p>
                  </div>

                  <div class="p-3 border rounded-lg bg-red-50">
                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="delete-cloud"
                        name="deleteOption"
                        checked={deleteDialog().deleteFrom === "cloud"}
                        onChange={() =>
                          setDeleteDialog((prev) => ({ ...prev, deleteFrom: "cloud" }))
                        }
                        class="mr-3"
                      />
                      <label for="delete-cloud" class="text-sm font-medium text-gray-900">
                        ☁️ Delete from Cloud Only
                      </label>
                    </div>
                    <p class="text-xs text-gray-600 ml-6">
                      Remove the book from cloud storage only. Local copy remains.
                    </p>
                  </div>

                  <div class="p-3 border rounded-lg bg-red-100">
                    <div class="flex items-center">
                      <input
                        type="radio"
                        id="delete-both"
                        name="deleteOption"
                        checked={deleteDialog().deleteFrom === "both"}
                        onChange={() =>
                          setDeleteDialog((prev) => ({ ...prev, deleteFrom: "both" }))
                        }
                        class="mr-3"
                      />
                      <label for="delete-both" class="text-sm font-medium text-gray-900">
                        🗑️ Delete from Both Local and Cloud
                      </label>
                    </div>
                    <p class="text-xs text-gray-600 ml-6">
                      Permanently remove the book from both this device and cloud storage.
                    </p>
                  </div>
                </Show>
              </div>

              <div class="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteDialog({ isOpen: false })}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBook}
                  disabled={!deleteDialog().deleteFrom}
                  class={`px-4 py-2 rounded-md transition-colors ${
                    deleteDialog().deleteFrom
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {deleteDialog().deleteFrom === "local" && "Delete Locally"}
                  {deleteDialog().deleteFrom === "cloud" && "Delete from Cloud"}
                  {deleteDialog().deleteFrom === "both" && "Delete Everywhere"}
                  {!deleteDialog().deleteFrom && "Select Option"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Rename Dialog */}
      <Show when={renameDialog().isOpen}>
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Rename Book</h3>
              <p class="text-gray-600 mb-4">Enter a new name for "{renameDialog().book?.name}":</p>
              <input
                type="text"
                value={renameDialog().newName}
                onInput={(e) =>
                  setRenameDialog((prev) => ({ ...prev, newName: e.currentTarget.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleRenameBook()}
                placeholder="Enter new book name..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />
              <div class="flex gap-3 justify-end">
                <button
                  onClick={() => setRenameDialog({ isOpen: false, newName: "" })}
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameBook}
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </Show>
  );
};

export default BookManagementModal;
