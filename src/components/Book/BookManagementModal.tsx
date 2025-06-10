import { Component, createSignal, createEffect, For, Show } from "solid-js";
import { bookStore } from "../../stores/bookStore";
import { bookService } from "../../services/bookService";
import { BookSummary, CloudBookInfo } from "../../services/bookManager";
import "../../styles/themes.css";

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
      // Also refresh the main book store so the book view shows correct sync status
      await bookStore.refetchBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync book");
    }
  };

  const handleImportCloudBook = async (cloudBook: CloudBookInfo) => {
    try {
      await bookService.importCloudBook(cloudBook.id);
      await loadBooks();
      // Also refresh the main book store so the book view shows the imported book
      await bookStore.refetchBooks();
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

  const BookCard: Component<{ book: BookSummary }> = ({ book }) => {
    const [showMenu, setShowMenu] = createSignal(false);
    const isSelected = () => bookStore.selectedBookId() === book.id;

    return (
      <div class={`theme-card p-4 cursor-pointer ${isSelected() ? "theme-card-selected" : ""}`}>
        <div class="flex items-start justify-between">
          <div class="flex-1" onClick={() => handleSelectBook(book)}>
            <h3 class="font-semibold text-lg theme-text-primary">{book.name}</h3>
            <div class="flex items-center gap-2 mt-1 text-sm theme-text-tertiary">
              <span>{getSyncStatusIcon(book.syncStatus)}</span>
              <span>{getSyncStatusText(book.syncStatus)}</span>
              <span class="px-2 py-1 text-xs font-medium theme-border-primary border theme-text-tertiary">
                {book.source}
              </span>
            </div>
          </div>

          <div class="relative">
            <button
              onClick={() => setShowMenu(!showMenu())}
              class="p-2 theme-text-secondary theme-hover-text theme-hover-bg theme-hover-border rounded-md theme-btn-secondary"
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
              <div class="absolute right-0 mt-2 w-48 theme-menu z-10">
                <div class="py-1">
                  <button
                    onClick={() => {
                      handleSelectBook(book);
                      setShowMenu(false);
                    }}
                    class="block w-full text-left px-4 py-2 text-sm theme-menu-item"
                  >
                    📖 Open Book
                  </button>
                  <button
                    onClick={() => {
                      setRenameDialog({ isOpen: true, book, newName: book.name });
                      setShowMenu(false);
                    }}
                    class="block w-full text-left px-4 py-2 text-sm theme-menu-item"
                  >
                    ✏️ Rename
                  </button>
                  <button
                    onClick={() => {
                      handleDuplicateBook(book);
                      setShowMenu(false);
                    }}
                    class="block w-full text-left px-4 py-2 text-sm theme-menu-item"
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
                      class="block w-full text-left px-4 py-2 text-sm theme-menu-item"
                    >
                      ⬇️ Pull from Cloud
                    </button>
                    <button
                      onClick={() => {
                        handleSyncBook(book, "push");
                        setShowMenu(false);
                      }}
                      class="block w-full text-left px-4 py-2 text-sm theme-menu-item"
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
                      class="block w-full text-left px-4 py-2 text-sm theme-menu-item"
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
                      class="block w-full text-left px-4 py-2 text-sm theme-text-muted hover:theme-text-secondary"
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
                      class="block w-full text-left px-4 py-2 text-sm theme-text-muted hover:theme-text-secondary"
                    >
                      🗑️ Delete Book...
                    </button>
                  </Show>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <div class="mt-3 text-sm theme-text-muted">
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
      <div class="fixed inset-0 z-50">
        <div class="theme-bg-secondary w-full h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div class="flex items-center justify-between p-6 theme-border-secondary border-b">
            <div>
              <h2 class="text-xl font-bold theme-text-primary">Book Management</h2>
              <p class="text-sm theme-text-tertiary mt-1">
                Manage your local and cloud books. Use manual sync to push/pull individual books.
              </p>
            </div>
            <button
              onClick={props.onClose}
              class="theme-text-muted hover:theme-text-tertiary transition-colors"
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
          <div class="theme-border-secondary border-b">
            <nav class="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("local")}
                class={`py-4 px-1 font-medium text-sm ${
                  activeTab() === "local" ? "theme-tab-active" : "theme-tab"
                }`}
              >
                💾 Local Books ({localBooks().length})
              </button>
              <button
                onClick={() => setActiveTab("cloud")}
                class={`py-4 px-1 font-medium text-sm ${
                  activeTab() === "cloud" ? "theme-tab-active" : "theme-tab"
                }`}
              >
                ☁️ Cloud Books ({cloudBooks().length})
              </button>
              <button
                onClick={() => setActiveTab("available")}
                class={`py-4 px-1 font-medium text-sm ${
                  activeTab() === "available" ? "theme-tab-active" : "theme-tab"
                }`}
              >
                ⬇️ Available ({availableCloudBooks().length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div class="p-6 overflow-y-auto flex-1">
            <Show when={error()}>
              <div class="mb-4 theme-alert">{error()}</div>
            </Show>

            {/* Local Books Tab */}
            <Show when={activeTab() === "local"}>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold theme-text-primary">Local Books</h3>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    class="px-4 py-2 theme-btn-primary text-sm"
                  >
                    ➕ New Book
                  </button>
                </div>

                <Show when={showCreateForm()}>
                  <div class="theme-card p-4">
                    <div class="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter book name..."
                        value={newBookName()}
                        onInput={(e) => setNewBookName(e.currentTarget.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateBook()}
                        class="flex-1 px-3 py-2 theme-input"
                      />
                      <button onClick={handleCreateBook} class="px-4 py-2 theme-btn-primary">
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewBookName("");
                          setError(null);
                        }}
                        class="px-4 py-2 theme-btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </Show>

                <div class="grid gap-4">
                  <For each={localBooks()}>{(book) => <BookCard book={book} />}</For>
                  <Show when={localBooks().length === 0 && !loading()}>
                    <div class="text-center py-8 theme-text-muted">
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
                  <h3 class="text-lg font-semibold theme-text-primary">Cloud Books</h3>
                  <button onClick={loadBooks} class="px-4 py-2 theme-btn-secondary text-sm">
                    🔄 Refresh
                  </button>
                </div>

                <div class="grid gap-4">
                  <For each={cloudBooks()}>{(book) => <BookCard book={book} />}</For>
                  <Show when={cloudBooks().length === 0 && !loading()}>
                    <div class="text-center py-8 theme-text-muted">
                      <div class="text-4xl mb-4">☁️</div>
                      <p>No cloud books found.</p>
                      <p class="text-sm mt-2">Books you sync to cloud will appear here.</p>
                    </div>
                  </Show>
                </div>
              </div>
            </Show>

            {/* Available Books Tab */}
            <Show when={activeTab() === "available"}>
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold theme-text-primary">Available Cloud Books</h3>
                  <button onClick={loadBooks} class="px-4 py-2 theme-btn-secondary text-sm">
                    🔄 Refresh
                  </button>
                </div>

                <div class="grid gap-4">
                  <For each={availableCloudBooks()}>
                    {(book) => (
                      <div class="theme-card p-4">
                        <div class="flex items-start justify-between">
                          <div>
                            <h3 class="font-semibold text-lg theme-text-primary">{book.name}</h3>
                            <p class="text-sm theme-text-tertiary mt-1">
                              Version: {book.version} • Modified:{" "}
                              {new Date(book.lastModified).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleImportCloudBook(book)}
                            class="px-4 py-2 theme-btn-primary text-sm"
                          >
                            ⬇️ Import
                          </button>
                        </div>
                      </div>
                    )}
                  </For>
                  <Show when={availableCloudBooks().length === 0 && !loading()}>
                    <div class="text-center py-8 theme-text-muted">
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
                <div class="animate-spin rounded-full h-8 w-8 border-b theme-spinner mr-3"></div>
                <span class="theme-text-tertiary">Loading books...</span>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Show when={deleteDialog().isOpen}>
        <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div class="theme-bg-secondary theme-border-primary theme-shadow-medium max-w-md w-full">
            <div class="p-6">
              <h3 class="text-lg font-semibold theme-text-primary mb-2">Delete Book</h3>
              <p class="theme-text-tertiary mb-4">
                Choose where to delete "{deleteDialog().book?.name}" from. This action cannot be
                undone.
              </p>

              {/* Warning for cloud deletions */}
              <Show
                when={deleteDialog().deleteFrom === "cloud" || deleteDialog().deleteFrom === "both"}
              >
                <div class="p-3 theme-border-hover border mb-4">
                  <p class="text-sm theme-text-tertiary">
                    ⚠️ Warning: Deleting from cloud will permanently remove the book from your
                    Google Drive.
                  </p>
                </div>
              </Show>

              <div class="space-y-3 mb-6">
                <Show when={deleteDialog().book?.source === "local"}>
                  <div class="p-3 theme-card">
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
                      <label for="delete-local-only" class="text-sm font-medium theme-text-primary">
                        💾 Delete from Local Storage Only
                      </label>
                    </div>
                    <p class="text-xs theme-text-tertiary ml-6">
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
                  <div class="p-3 theme-card">
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
                      <label for="delete-local" class="text-sm font-medium theme-text-primary">
                        💾 Delete from Local Storage Only
                      </label>
                    </div>
                    <p class="text-xs theme-text-tertiary ml-6">
                      Remove the book from this device only. Cloud copy remains intact.
                    </p>
                  </div>

                  <div class="p-3 theme-card">
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
                      <label for="delete-cloud" class="text-sm font-medium theme-text-primary">
                        ☁️ Delete from Cloud Only
                      </label>
                    </div>
                    <p class="text-xs theme-text-tertiary ml-6">
                      Remove the book from cloud storage only. Local copy remains.
                    </p>
                  </div>

                  <div class="p-3 theme-border-hover border">
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
                      <label for="delete-both" class="text-sm font-medium theme-text-primary">
                        🗑️ Delete from Both Local and Cloud
                      </label>
                    </div>
                    <p class="text-xs theme-text-tertiary ml-6">
                      Permanently remove the book from both this device and cloud storage.
                    </p>
                  </div>
                </Show>
              </div>

              <div class="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteDialog({ isOpen: false })}
                  class="px-4 py-2 theme-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBook}
                  disabled={!deleteDialog().deleteFrom}
                  class={`px-4 py-2 transition-colors ${
                    deleteDialog().deleteFrom
                      ? "theme-btn-primary"
                      : "theme-btn-secondary opacity-50 cursor-not-allowed"
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
        <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div class="theme-bg-secondary theme-border-primary theme-shadow-medium max-w-md w-full">
            <div class="p-6">
              <h3 class="text-lg font-semibold theme-text-primary mb-2">Rename Book</h3>
              <p class="theme-text-tertiary mb-4">
                Enter a new name for "{renameDialog().book?.name}":
              </p>
              <input
                type="text"
                value={renameDialog().newName}
                onInput={(e) =>
                  setRenameDialog((prev) => ({ ...prev, newName: e.currentTarget.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleRenameBook()}
                placeholder="Enter new book name..."
                class="w-full px-3 py-2 theme-input mb-4"
              />
              <div class="flex gap-3 justify-end">
                <button
                  onClick={() => setRenameDialog({ isOpen: false, newName: "" })}
                  class="px-4 py-2 theme-btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleRenameBook} class="px-4 py-2 theme-btn-primary">
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
