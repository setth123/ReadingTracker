<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import BookCard from "../components/BookCard.vue";
import {searchBooks} from "../services/book.service.js";
import {getBookshelf, addToBookshelf,} from "../services/bookshelf.service.js";
  
import "../assets/search.css";

const router = useRouter();

const keyword = ref("");
const books = ref([]);
const bookshelfWorkIds = ref(new Set());

const loading = ref(false);
const searched = ref(false);

const currentPage = ref(1);
const totalPages = ref(1);

const showAddModal = ref(false);
const selectedBook = ref(null);
const selectedStatus = ref("WANT_TO_READ");

const search = async (page = 1) => {
  if (!keyword.value.trim()) {
    alert("Vui lòng nhập tên sách hoặc tác giả.");
    return;
  }

  loading.value = true;

  try {
    const response = await searchBooks({
      q: keyword.value.trim(),
      page,
    });

    books.value = response.data.books;

    currentPage.value = response.data.pagination.page;

    totalPages.value = Math.max(
      1,
      Math.ceil(
        response.data.pagination.total /
          response.data.pagination.limit
      )
    );

    searched.value = true;
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Không thể tìm kiếm sách."
    );
  } finally {
    loading.value = false;
  }
};

const loadBookshelf = async () => {
  try {
    const response = await getBookshelf();

    bookshelfWorkIds.value = new Set(
      response.data.books.map(
        (book) => book.workId
      )
    );
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Không thể tải tủ sách."
    );
  }
};

const openAddModal = (book) => {
  selectedBook.value = book;
  selectedStatus.value = "WANT_TO_READ";
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
  selectedBook.value = null;
};

const confirmAddBook = async () => {
  if (!selectedBook.value) {
    return;
  }

  try {
    await addToBookshelf({
      workId: selectedBook.value.workId,
      status: selectedStatus.value,
    });

    bookshelfWorkIds.value = new Set(
      bookshelfWorkIds.value
    );

    bookshelfWorkIds.value.add(
      selectedBook.value.workId
    );

    closeAddModal();
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Không thể thêm sách vào tủ."
    );
  }
};

const openBookDetail = (book) => {
  router.push(`/books/${book.workId}`);
};

const goToPage = (page) => {
  if (
    page < 1 ||
    page > totalPages.value ||
    page === currentPage.value ||
    loading.value
  ) {
    return;
  }

  search(page);
};

const getPageNumbers = () => {
  const pages = [];

  const start = Math.max(
    1,
    currentPage.value - 2
  );

  const end = Math.min(
    totalPages.value,
    currentPage.value + 2
  );

  for (let page = start; page <= end; page++) {
    pages.push(page);
  }

  return pages;
};

onMounted(loadBookshelf);
</script>

<template>
  <div class="search-page">
    <section class="search-hero">
      <div class="search-hero-content">
        <h1>Tìm cuốn sách tiếp theo của bạn</h1>

        <p>
          Tìm kiếm sách theo tên hoặc tác giả và
          thêm những cuốn bạn muốn đọc vào tủ sách.
        </p>

        <form class="search-form" @submit.prevent="search(1)">
          <div class="search-input-wrapper">
            <input
              v-model="keyword"
              class="search-input"
              type="text"
              placeholder="Nhập tên sách hoặc tác giả..."/>
          </div>

          <button class="search-button" type="submit" :disabled="loading">
            {{ loading ? "Đang tìm..." : "Tìm kiếm" }}
          </button>
        </form>
      </div>
    </section>

    <template v-if="loading">
      <div class="search-state">
        <div class="search-state-icon">
          📚
        </div>

        <p class="search-state-title">
          Đang tìm kiếm...
        </p>

        <p class="search-state-text">
          Vui lòng chờ một chút.
        </p>
      </div>
    </template>

    <template v-else-if="searched && books.length === 0">
      <div class="search-state">
        <div class="search-state-icon">
          🔍
        </div>

        <p class="search-state-title">
          Không tìm thấy sách
        </p>

        <p class="search-state-text">
          Hãy thử tìm kiếm với từ khóa khác.
        </p>
      </div>
    </template>

    <template v-else-if="books.length > 0">
      <div class="search-result-header">
        <h2>Kết quả tìm kiếm</h2>

        <span class="search-result-count">
          Trang {{ currentPage }} / {{ totalPages }}
        </span>
      </div>

      <section class="book-grid">
        <BookCard
          v-for="book in books"
          :key="book.workId"
          :book="book"
          :is-added="bookshelfWorkIds.has(book.workId)"
          @add="openAddModal"
          @view="openBookDetail"/>
      </section>

      <nav
        v-if="totalPages > 1"
        class="pagination">
        <button
          :disabled="
            currentPage === 1 || loading
          "
          @click="goToPage(currentPage - 1)">
          ←
        </button>

        <button
          v-for="page in getPageNumbers()"
          :key="page"
          :class="{
            active: currentPage === page,
          }"
          :disabled="loading"
          @click="goToPage(page)">
          {{ page }}
        </button>

        <button
          :disabled="
            currentPage === totalPages ||
            loading
          "
          @click="goToPage(currentPage + 1)">
          →
        </button>
      </nav>
    </template>

    <div v-else class="search-state">
      <div class="search-state-icon">
        📚
      </div>

      <p class="search-state-title">
        Tìm kiếm sách
      </p>

      <p class="search-state-text">
        Nhập tên sách hoặc tác giả để bắt đầu.
      </p>
    </div>

    <!-- Add to bookshelf modal -->
    <div
      v-if="showAddModal"
      class="add-book-overlay"
      @click.self="closeAddModal">
      
      <div class="add-book-modal">
        <h2>Thêm vào tủ sách</h2>

        <p>
          Chọn trạng thái ban đầu cho
          <strong>
            {{ selectedBook?.title }}
          </strong>
        </p>

        <div class="status-options">
          <button
            class="status-option"
            :class="{
              selected:
                selectedStatus ===
                'WANT_TO_READ',
            }"
            @click="
              selectedStatus = 'WANT_TO_READ'
            ">
            <strong>Muốn đọc</strong>
            <span>
              Lưu lại để đọc sau
            </span>
          </button>

          <button
            class="status-option"
            :class="{
              selected:
                selectedStatus ===
                'READING',
            }"
            @click="
              selectedStatus = 'READING'
            "
          >
            <strong>Đang đọc</strong>
            <span>
              Bắt đầu theo dõi tiến độ đọc
            </span>
          </button>

          <button
            class="status-option"
            :class="{
              selected:
                selectedStatus ===
                'COMPLETED',
            }"
            @click="
              selectedStatus = 'COMPLETED'
            "
          >
            <strong>Đã đọc</strong>
            <span>
              Đánh dấu là đã hoàn thành
            </span>
          </button>
        </div>

        <div class="modal-actions">
          <button
            class="btn btn-secondary"
            @click="closeAddModal"
          >
            Hủy
          </button>

          <button
            class="btn btn-primary"
            @click="confirmAddBook"
          >
            Thêm vào tủ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
