import { Component, createSignal } from "solid-js";
import { settingsStore } from "@stores/settingsStore";
import CreateBookModal from "./CreateBookModal";
import LoadBookModal from "./LoadBookModal";

const BookList: Component = () => {
  const [showCreateModal, setShowCreateModal] = createSignal(false);
  const [showLoadModal, setShowLoadModal] = createSignal(false);

  return (
    <>
      <div class="flex flex-col items-center justify-center h-full bg-gray-50">
        <div class="p-8 bg-white shadow-lg rounded-lg border border-gray-200 max-w-md w-full mx-4">
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">📚</div>
            <h2 class="text-3xl font-bold text-gray-900 mb-2">Welcome to TSWriter</h2>
            <p class="text-gray-600">Create a new book or load an existing one to begin writing</p>
            <p class="text-sm text-gray-500 mt-2">
              Your work is automatically saved locally and can be synced to Google Drive.
            </p>
          </div>

          <div class="space-y-4">
            <button
              onClick={() => setShowCreateModal(true)}
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm"
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
              class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm"
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
              onClick={() => settingsStore.openSettings()}
              class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 border border-gray-300"
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
    </>
  );
};

export default BookList;
