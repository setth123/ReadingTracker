<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import {getBookDetail} from "../services/book.service.js";

import {getBookshelf, addToBookshelf,} from "../services/bookshelf.service.js";

const route = useRoute();

const book = ref(null);

const loading = ref(true);
const error = ref("");

const isAdded = ref(false);

const showStatusModal = ref(false);

const loadBook = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await getBookDetail(
      route.params.workId
    );

    book.value = response.data;
  } catch (err) {
    console.error(err);

    error.value =
      err.response?.data?.message ||
      "Failed to load book";
  } finally {
    loading.value = false;
  }
};

const checkBookshelf = async () => {
  try {
    const response = await getBookshelf();

    isAdded.value = response.data.books.some(
      (item) =>
        item.workId === route.params.workId
    );
  } catch (err) {
    console.error(err);
  }
};

const openAddModal = () => {
  showStatusModal.value = true;
};

const closeAddModal = () => {
  showStatusModal.value = false;
};

const confirmAddBook = async (status) => {
  try {
    await addToBookshelf({
      workId: book.value.workId,
      status,
    });

    isAdded.value = true;

    closeAddModal();
  } catch (err) {
    console.error(err);

    error.value =
      err.response?.data?.message ||
      "Failed to add book to shelf";
  }
};

onMounted(async () => {
  await loadBook();
  await checkBookshelf();
});
</script>
<template>
  <main class="book-detail-page">
    <div v-if="loading">
      Loading book...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="book" class="book-detail">
      <div class="book-detail-cover">
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          :alt="book.title"
        />

        <div v-else class="no-cover">
          No Cover
        </div>
      </div>

      <div class="book-detail-info">
        <h1>{{ book.title }}</h1>

        <p>
          <strong>Authors:</strong>
          {{ book.authors?.join(", ") || "Unknown" }}
        </p>

        <p>
          <strong>Published:</strong>
          {{ book.publishedYear || "Unknown" }}
        </p>

        <p>
          <strong>Pages:</strong>
          {{ book.pageCount || "Unknown" }}
        </p>

        <div>
          <strong>Description</strong>

          <p>
            {{ book.description || "No description available." }}
          </p>
        </div>

        <div v-if="book.subjects?.length">
          <strong>Subjects</strong>

          <div class="subjects">
            <span
              v-for="subject in book.subjects.slice(0, 15)"
              :key="subject"
              class="subject"
            >
              {{ subject }}
            </span>
          </div>
        </div>

        <button
          :disabled="isAdded"
          @click="openAddModal"
        >
          {{ isAdded ? "Đã thêm" : "Add to Shelf" }}
        </button>
      </div>
    </div>

    <div
      v-if="showStatusModal"
      class="modal-overlay"
      @click.self="closeAddModal"
    >
      <div class="modal">
        <h2>Add to Shelf</h2>

        <p>{{ book.title }}</p>

        <button
          @click="confirmAddBook('WANT_TO_READ')"
        >
          Want to Read
        </button>

        <button
          @click="confirmAddBook('READING')"
        >
          Reading
        </button>

        <button
          @click="confirmAddBook('COMPLETED')"
        >
          Completed
        </button>

        <button @click="closeAddModal">
          Cancel
        </button>
      </div>
    </div>
  </main>
</template>