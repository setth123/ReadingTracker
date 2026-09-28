<script setup>
import { onMounted, ref } from "vue";
import {useRouter} from "vue-router";
import BookCard from "../components/BookCard.vue";
import { searchBooks } from "../services/book.service.js";
import {getBookshelf, addToBookshelf} from "../services/bookshelf.service.js";

const router= useRouter();
const openBookDetail=(book) => {
  router.push(`/books/${book.workId}`);
};

const keyword = ref("");
const books = ref([]);

const loading = ref(false);
const error = ref("");
const searched = ref(false);

const currentPage = ref(1);
const totalPages = ref(1);

const bookshelfWorkIds = ref(new Set());
const loadBookShelf = async()=>{
    try {
    const response = await getBookshelf();

    bookshelfWorkIds.value = new Set(response.data.books.map((book) => book.workId));
    } catch (error) {
        console.error("Failed to load bookshelf", error);
    }
}
onMounted(() => {loadBookShelf();});

const selectedBook = ref(null);
const showStatusModal = ref(false);
const openAddModal = (book) => {
  selectedBook.value = book;
  showStatusModal.value = true;
};
const closeAddModal = () => {
  selectedBook.value = null;
  showStatusModal.value = false;
};
const confirmAddBook = async (status) => {
  if (!selectedBook.value) {
    return;
  }

  try {
    await addToBookshelf({
      workId: selectedBook.value.workId,
      status,
    });

    bookshelfWorkIds.value.add(
      selectedBook.value.workId
    );

    bookshelfWorkIds.value = new Set(
      bookshelfWorkIds.value
    );

    closeAddModal();
  } catch (err) {
    console.error(err);

    error.value =
      err.response?.data?.message ||
      "Failed to add book to shelf";
  }
};

const search = async (page = 1) => {
  if (!keyword.value.trim()) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const response = await searchBooks({
      q: keyword.value.trim(),
      page,
    });

    books.value = response.data.books;

    currentPage.value = response.data.pagination.page;

    const total = response.data.pagination.total;
    const limit = response.data.pagination.limit;

    totalPages.value = Math.ceil(total / limit);

    searched.value = true;
  } catch (err) {
    console.error(err);

    error.value =
      err.response?.data?.message ||
      "Failed to search books";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="search-page">
    <h1>Search Books</h1>

    <form @submit.prevent="search(1)">
      <input
        v-model="keyword"
        type="text"
        placeholder="Search by title or author..."
      />

      <button type="submit" :disabled="loading">
        {{ loading ? "Searching..." : "Search" }}
      </button>
    </form>

    <div v-if="loading" class="loading">
      Loading books...
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div
      v-else-if="searched && books.length === 0"
      class="empty">
      No books found.
    </div>

    <div v-else class="book-grid">
      <BookCard
        v-for="book in books"
        :key="book.workId"
        :book="book"
        :is-added="bookshelfWorkIds.has(book.workId)"
        @add="openAddModal"
        @view="openBookDetail"/>
    </div>

    <div
      v-if="!loading && books.length > 0"
      class="pagination">

      <button
        :disabled="currentPage <= 1"
        @click="search(currentPage - 1)">
        Previous
      </button>

      <span>
        Page {{ currentPage }} / {{ totalPages }}
      </span>

      <button
        :disabled="currentPage >= totalPages"
        @click="search(currentPage + 1)">
        Next
      </button>

    </div>

    <div
        v-if="showStatusModal"
        class="modal-overlay"
        @click.self="closeAddModal"
    >
        <div class="modal">
            <h2>Add to Shelf</h2>

            <p v-if="selectedBook">
            {{ selectedBook.title }}
            </p>

            <div class="status-options">
            <button @click="confirmAddBook('WANT_TO_READ')">Want to Read</button>

            <button @click="confirmAddBook('READING')">Reading</button>

            <button @click="confirmAddBook('COMPLETED')">Completed</button>
            </div>

            <button @click="closeAddModal">Cancel</button>
        </div>
    </div>

  </main>
</template>