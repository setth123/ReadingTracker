<script setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useRouter } from "vue-router";

import BookCard from "../components/BookCard.vue";

import {
  searchBooks,
  getSearchHistory,
} from "../services/book.service.js";

import {
  getBookshelf,
  addToBookshelf,
} from "../services/bookshelf.service.js";

import {
  searchKeyword,
  searchPage,
} from "../stores/appState.js"

import "../assets/search.css";

const router = useRouter();

// ===============================
// STATE
// ===============================

const keyword = ref("");
const books = ref([]);
const bookshelfWorkIds = ref(new Set());

const loading = ref(false);
const searched = ref(false);

const currentPage = ref(1);
const totalPages = ref(1);

const searchHistory = ref([]);
const showSearchHistory = ref(false);

const showAddModal = ref(false);
const selectedBook = ref(null);
const selectedStatus = ref("WANT_TO_READ");

// ===============================
// SEARCH CONTROL
// ===============================

let historyTimeout = null;

// ===============================
// SEARCH HISTORY
// ===============================

const loadSearchHistory = (value = "") => {
  if (historyTimeout) {
    clearTimeout(historyTimeout);
  }

  historyTimeout = setTimeout(async () => {
    try {
      const response = await getSearchHistory(value);

      searchHistory.value = response.data.keywords;
      showSearchHistory.value = true;
    } catch (error) {
      console.error(
        "Failed to load search history:",
        error
      );
    }
  }, 500);
};

const handleSearchFocus = () => {
  loadSearchHistory(keyword.value);
};

const handleSearchInput = (event) => {
  keyword.value = event.target.value;

  loadSearchHistory(keyword.value);
};

const handleSelectSearchHistory = async (
  historyKeyword
) => {
  keyword.value = historyKeyword;

  showSearchHistory.value = false;

  searchPage.value = 1;

  await search(1, false);
};

// ===============================
// RESET SEARCH
// ===============================

const resetSearch = () => {
  books.value = [];
  searched.value = false;

  currentPage.value = 1;
  totalPages.value = 1;
};

// ===============================
// SEARCH
// ===============================

const search = async (
  page = 1,
  saveHistory = false
) => {
  const value = keyword.value.trim();
  if(value<3){
    alert("Từ khóa phải dài hơn 2 ký tự);
    return;
  }
  loading.value = true;
  showSearchHistory.value = false;

  try {
    const response = await searchBooks({
      q: value,
      page,
    });

    books.value = response.data.books;

    currentPage.value =
      response.data.pagination.page;

    totalPages.value = Math.max(
      1,
      Math.ceil(
        response.data.pagination.total /
          response.data.pagination.limit
      )
    );

    searched.value = true;

    // Lưu trạng thái tìm kiếm để giữ lại
    // khi chuyển sang route khác.
    searchKeyword.value = value;
    searchPage.value = page;

    // Backend đã lưu history khi search.
    // Chỉ reload suggestion để UI có dữ liệu mới nhất.
    if (saveHistory) {
      const historyResponse =
        await getSearchHistory();

      searchHistory.value =
        historyResponse.data.keywords;
    }
  } catch (error) {
    alert(
      error.response?.data?.message ||
        "Không thể tìm kiếm sách."
    );
  } finally {
    loading.value = false;
  }
};

// ===============================
// SUBMIT SEARCH
// ===============================

const handleSubmit = async () => {
  if (historyTimeout) {
    clearTimeout(historyTimeout);
    historyTimeout = null;
  }

  const value = keyword.value.trim();

  searchPage.value = 1;

  await search(1, true);
};

// ===============================
// BOOKSHELF
// ===============================

const loadBookshelf = async () => {
  try {
    const response = await getBookshelf();

    bookshelfWorkIds.value = new Set(
      response.data.books.map(
        (book) => book.workId
      )
    );
  } catch (error) {
    alert(
      error.response?.data?.message ||
        "Không thể tải tủ sách."
    );
  }
};

// ===============================
// ADD BOOK MODAL
// ===============================

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
  } catch (error) {
    alert(
      error.response?.data?.message ||
        "Không thể thêm sách vào tủ."
    );
  }
};

// ===============================
// BOOK DETAIL
// ===============================

const openBookDetail = (book) => {
  router.push(`/books/${book.workId}`);
};

// ===============================
// PAGINATION
// ===============================

const goToPage = async (page) => {
  if (
    page < 1 ||
    page > totalPages.value ||
    page === currentPage.value ||
    loading.value
  ) {
    return;
  }

  searchPage.value = page;

  await search(page, false);
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

// ===============================
// LIFECYCLE
// ===============================

onMounted(async () => {
  await loadBookshelf();

  // Load history để hiển thị khi focus vào input.
  try {
    const response = await getSearchHistory();

    searchHistory.value =
      response.data.keywords;
  } catch (error) {
    console.error(
      "Failed to load search history:",
      error
    );
  }

  // Khôi phục search trước đó nếu user
  // quay lại SearchPage từ route khác.
  if (searchKeyword.value) {
    keyword.value = searchKeyword.value;

    await search(
      searchPage.value || 1,
      false
    );
  }
});

onBeforeUnmount(() => {
  if (historyTimeout) {
    clearTimeout(historyTimeout);
    historyTimeout = null;
  }
});
</script>

<template>
  <div class="search-page">
    <!-- ===============================
         SEARCH HERO
    ================================ -->

    <section class="search-hero">
      <div class="search-hero-content">
        <h1>Tìm cuốn sách tiếp theo của bạn</h1>

        <p>
          Tìm kiếm sách theo tên hoặc tác giả và
          thêm những cuốn bạn muốn đọc vào tủ sách.
        </p>

        <form
          class="search-form"
          @submit.prevent="handleSubmit"
        >
          <div class="search-input-wrapper">
            <input
              :value="keyword"
              class="search-input"
              type="text"
              placeholder="Nhập tên sách hoặc tác giả..."
              @input="handleSearchInput"
              @focus="handleSearchFocus"
            />

            <!-- ===============================
                 SEARCH HISTORY
            ================================ -->

            <div
              v-if="
                showSearchHistory &&
                searchHistory.length > 0
              "
              class="search-history"
            >
              <button
                v-for="historyKeyword in searchHistory"
                :key="historyKeyword"
                type="button"
                class="search-history-item"
                @mousedown.prevent="
                  handleSelectSearchHistory(
                    historyKeyword
                  )
                "
              >
                {{ historyKeyword }}
              </button>
            </div>
          </div>

          <button
            class="search-button"
            type="submit"
            :disabled="loading"
          >
            {{
              loading
                ? "Đang tìm..."
                : "Tìm kiếm"
            }}
          </button>
        </form>
      </div>
    </section>

    <!-- ===============================
         LOADING
    ================================ -->

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

    <!-- ===============================
         EMPTY RESULT
    ================================ -->

    <template
      v-else-if="
        searched &&
        books.length === 0
      "
    >
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

    <!-- ===============================
         SEARCH RESULTS
    ================================ -->

    <template
      v-else-if="books.length > 0"
    >
      <div class="search-result-header">
        <h2>Kết quả tìm kiếm</h2>

        <span class="search-result-count">
          Trang {{ currentPage }} /
          {{ totalPages }}
        </span>
      </div>

      <section class="book-grid">
        <BookCard
          v-for="book in books"
          :key="book.workId"
          :book="book"
          :is-added="
            bookshelfWorkIds.has(
              book.workId
            )
          "
          @add="openAddModal"
          @view="openBookDetail"
        />
      </section>

      <!-- ===============================
           PAGINATION
      ================================ -->

      <nav
        v-if="totalPages > 1"
        class="pagination"
      >
        <button
          :disabled="
            currentPage === 1 ||
            loading
          "
          @click="
            goToPage(currentPage - 1)
          "
        >
          ←
        </button>

        <button
          v-for="page in getPageNumbers()"
          :key="page"
          :class="{
            active:
              currentPage === page,
          }"
          :disabled="loading"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>

        <button
          :disabled="
            currentPage === totalPages ||
            loading
          "
          @click="
            goToPage(currentPage + 1)
          "
        >
          →
        </button>
      </nav>
    </template>

    <!-- ===============================
         INITIAL STATE
    ================================ -->

    <div
      v-else
      class="search-state"
    >
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

    <!-- ===============================
         ADD TO BOOKSHELF MODAL
    ================================ -->

    <div
      v-if="showAddModal"
      class="add-book-overlay"
      @click.self="closeAddModal"
    >
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
            type="button"
            class="status-option"
            :class="{
              selected:
                selectedStatus ===
                'WANT_TO_READ',
            }"
            @click="
              selectedStatus =
                'WANT_TO_READ'
            "
          >
            <strong>Muốn đọc</strong>

            <span>
              Lưu lại để đọc sau
            </span>
          </button>

          <button
            type="button"
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
            type="button"
            class="status-option"
            :class="{
              selected:
                selectedStatus ===
                'COMPLETED',
            }"
            @click="
              selectedStatus =
                'COMPLETED'
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
            type="button"
            class="btn btn-secondary"
            @click="closeAddModal"
          >
            Hủy
          </button>

          <button
            type="button"
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
