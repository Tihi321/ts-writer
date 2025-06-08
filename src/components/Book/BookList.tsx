import { Component, createSignal } from "solid-js";
import { settingsStore } from "@stores/settingsStore";
import CreateBookModal from "./CreateBookModal";
import LoadBookModal from "./LoadBookModal";
import BookManagementModal from "./BookManagementModal";

const BookList: Component = () => {
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [showLoadModal, setShowLoadModal] = createSignal(false);
  const [showManagementModal, setShowManagementModal] = createSignal(false);

  return (
    <>
      <div class="flex flex-col items-center justify-center h-full">
        <div class="p-8 border border-gray-300 max-w-md w-full mx-4">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">📚</div>
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome to TSWriter</h2>
            <p class="text-gray-600">Create a new book or load an existing one to begin writing</p>
            <p class="text-sm text-gray-500 mt-2">
              Your work is automatically saved locally. Use manual sync to sync with Google Drive.
            </p>
          </div>

          <div class="space-y-4">
            <button
              onClick={() => setShowCreateModal(true)}
              class="w-full border border-gray-600 text-gray-800 hover:text-gray-900 hover:border-gray-700 font-medium py-3 px-4 transition-colors duration-200"
            >
              <div class="flex items-center justify-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Create New Book</span>
              </div>
            </button>

            <button
              onClick={() => setShowLoadModal(true)}
              class="w-full border border-gray-600 text-gray-800 hover:text-gray-900 hover:border-gray-700 font-medium py-3 px-4 transition-colors duration-200"
            >
              <div class="flex items-center justify-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Load Existing Book</span>
              </div>
            </button>

            <button
              onClick={() => setShowManagementModal(true)}
              class="w-full border border-gray-600 text-gray-800 hover:text-gray-900 hover:border-gray-700 font-medium py-3 px-4 transition-colors duration-200"
            >
              <div class="flex items-center justify-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>Manage Books</span>
              </div>
            </button>

            <button
              onClick={() => settingsStore.openSettings()}
              class="w-full border border-gray-300 text-gray-700 hover:text-gray-800 hover:border-gray-400 font-medium py-3 px-4 transition-colors duration-200"
            >
              <div class="flex items-center justify-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Settings</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateBookModal isOpen={showCreateModal()} onClose={() => setShowCreateModal(false)} />
      <LoadBookModal isOpen={showLoadModal()} onClose={() => setShowLoadModal(false)} />
      <BookManagementModal
        isOpen={showManagementModal()}
        onClose={() => setShowManagementModal(false)}
      />
    </>
  );
};

export default BookList;
