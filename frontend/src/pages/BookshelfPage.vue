
<script setup>
import { onMounted, ref } from "vue";
import {getBookshelf, updateBookshelfBook, deleteBookshelfBook} from "../services/bookshelf.service.js";
import { useRouter } from "vue-router";

import "../assets/bookshelf.css";

const books = ref([]);
const statistics = ref({
  total: 0,
  wantToRead: 0,
  reading: 0,
  completed: 0,
});

const activeStatus = ref("");
const loading = ref(false);

const statusTabs = [
  {
    value: "",
    label: "Tất cả",
  },
  {
    value: "WANT_TO_READ",
    label: "Muốn đọc",
  },
  {
    value: "READING",
    label: "Đang đọc",
  },
  {
    value: "COMPLETED",
    label: "Đã đọc",
  },
];

const getErrorMessage = (err, fallback) => {
  if (!err.response) {
    return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
  }

  if (err.response.status >= 500) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  }

  return err.response.data?.message || fallback;
};

const loadBookshelf = async () => {
  loading.value = true;

  try {
    const response = await getBookshelf(activeStatus.value);

    books.value = response.data.books;
    statistics.value = response.data.statistics;
  } catch (err) {
    alert(
      getErrorMessage(
        err,
        "Không thể tải tủ sách. Vui lòng thử lại."
      )
    );
  } finally {
    loading.value = false;
  }
};

const changeStatus = async (status) => {
  if (loading.value) {
    return;
  }

  activeStatus.value = status;
  await loadBookshelf();
};

const getProgress = (book) => {
  if (!book.pageCount || book.pageCount <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((book.currentPage / book.pageCount) * 100)
  );
};

const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  };

const updatePage = async (book, event) => {
  const value = event.target.value.trim();

  if (value === "") {
    alert("Vui lòng nhập số trang hiện tại.");
    event.target.value = book.currentPage;
    return;
  }

  if (!/^\d+$/.test(value)) {
    alert("Số trang chỉ được chứa chữ số.");
    event.target.value = book.currentPage;
    return;
  }

  const currentPage = Number(value);

  if (!Number.isInteger(currentPage)) {
    alert("Số trang phải là số nguyên.");
    event.target.value = book.currentPage;
    return;
  }

  if (currentPage < 0) {
    alert("Số trang không được nhỏ hơn 0.");
    event.target.value = book.currentPage;
    return;
  }

  if (
    book.pageCount !== null &&
    book.pageCount !== undefined &&
    currentPage > book.pageCount
  ) {
    alert(
      `Số trang hiện tại không được vượt quá ${book.pageCount}.`
    );
    event.target.value = book.currentPage;
    return;
  }

  const oldPage = book.currentPage;
  const oldStatus = book.status;
  

  try {
    const response = await updateBookshelfBook(book.id, {
      currentPage,
    });

    const updatedBook = response.data;

    Object.assign(book, updatedBook);

    // Backend có thể tự chuyển READING -> COMPLETED
    // khi currentPage == pageCount.
    if (oldStatus !== updatedBook.status) {
      updateStatisticsAfterStatusChange(
        oldStatus,
        updatedBook.status
      );

      // Nếu đang xem một tab cụ thể và sách vừa chuyển
      // sang status khác thì loại khỏi danh sách hiện tại.
      if (
        activeStatus.value !== "" &&
        updatedBook.status !== activeStatus.value
      ) {
        books.value = books.value.filter(
          (item) => item.id !== book.id
        );
      }
    }
  } catch (err) {
    event.target.value = oldPage;

    alert(
      getErrorMessage(
        err,
        "Không thể cập nhật số trang."
      )
    );
  }
};

const updateStatus = async (book, event) => {
  const newStatus = event.target.value;
  const oldStatus = book.status;

  if (newStatus === oldStatus) {
    return;
  }

  try {
    const response = await updateBookshelfBook(book.id, {
      status: newStatus,
    });

    const updatedBook = response.data;

    Object.assign(book, updatedBook);

    // Dùng status thực tế từ backend thay vì newStatus,
    // vì backend có thể áp dụng business rule khác.
    updateStatisticsAfterStatusChange(
      oldStatus,
      updatedBook.status
    );

    if (
      activeStatus.value !== "" &&
      updatedBook.status !== activeStatus.value
    ) {
      books.value = books.value.filter(
        (item) => item.id !== book.id
      );
    }
  } catch (err) {
    event.target.value = oldStatus;

    alert(
      getErrorMessage(
        err,
        "Không thể cập nhật trạng thái."
      )
    );
  }
};

const updateRating = async (book, event) => {
  const value = event.target.value;
  const rating = value === "" ? null : Number(value);

  const oldRating = book.rating;

  try {
    const response = await updateBookshelfBook(book.id, {
      rating,
    });

    const updatedBook = response.data;

    Object.assign(book, updatedBook);
  } catch (err) {
    event.target.value = oldRating || "";

    alert(
      getErrorMessage(
        err,
        "Không thể cập nhật đánh giá."
      )
    );
  }
};

const updateNote = async (book, event) => {
  const note = event.target.value.trim();
  const oldNote = book.note;

  try {
    const response = await updateBookshelfBook(book.id, {
      note: note || null,
    });

    const updatedBook = response.data;

    Object.assign(book, updatedBook);
  } catch (err) {
    event.target.value = oldNote || "";

    alert(
      getErrorMessage(
        err,
        "Không thể cập nhật ghi chú."
      )
    );
  }
};

const deleteBook = async (book) => {
  const confirmed = window.confirm(
    `Bạn có chắc muốn xoá "${book.title}" khỏi tủ sách?`
  );

  if (!confirmed) {
    return;
  }

  try {
    await deleteBookshelfBook(book.id);

    books.value = books.value.filter(
      (item) => item.id !== book.id
    );

    updateStatisticsAfterDelete(book);
  } catch (err) {
    alert(
      getErrorMessage(
        err,
        "Không thể xoá sách. Vui lòng thử lại."
      )
    );
  }
};

const router = useRouter();

const openBookDetail = (book) => {
  router.push(`/books/${book.workId}`);
};

const updateStatisticsAfterStatusChange = (
  oldStatus,
  newStatus
) => {
  if (oldStatus === newStatus) {
    return;
  }

  const stats = {
    ...statistics.value,
  };

  if (oldStatus === "WANT_TO_READ") {
    stats.wantToRead = Math.max(0, stats.wantToRead - 1);
  }

  if (oldStatus === "READING") {
    stats.reading = Math.max(0, stats.reading - 1);
  }

  if (oldStatus === "COMPLETED") {
    stats.completed = Math.max(0, stats.completed - 1);
  }

  if (newStatus === "WANT_TO_READ") {
    stats.wantToRead += 1;
  }

  if (newStatus === "READING") {
    stats.reading += 1;
  }

  if (newStatus === "COMPLETED") {
    stats.completed += 1;
  }

  statistics.value = stats;
};

const updateStatisticsAfterDelete = (book) => {
  const stats = {
    ...statistics.value,
    total: Math.max(0, statistics.value.total - 1),
  };

  if (book.status === "WANT_TO_READ") {
    stats.wantToRead = Math.max(0, stats.wantToRead - 1);
  }

  if (book.status === "READING") {
    stats.reading = Math.max(0, stats.reading - 1);
  }

  if (book.status === "COMPLETED") {
    stats.completed = Math.max(0, stats.completed - 1);
  }

  statistics.value = stats;
};

onMounted(loadBookshelf);
</script>

<template>
  <div class="bookshelf-page">
    <header class="page-header">
      <div>
        <h1>Tủ sách của tôi</h1>
        <p>Theo dõi những cuốn sách bạn đang đọc</p>
      </div>
    </header>

    <section class="statistics">
      <div class="stat-card">
        <span class="stat-label">Tổng số sách</span>
        <strong>{{ statistics.total }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Muốn đọc</span>
        <strong>{{ statistics.wantToRead }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Đang đọc</span>
        <strong>{{ statistics.reading }}</strong>
      </div>

      <div class="stat-card">
        <span class="stat-label">Đã đọc</span>
        <strong>{{ statistics.completed }}</strong>
      </div>
    </section>

    <nav class="status-tabs">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        :class="{ active: activeStatus === tab.value }"
        :disabled="loading"
        @click="changeStatus(tab.value)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div
      v-if="loading && books.length === 0"
      class="state"
    >
      Đang tải tủ sách...
    </div>

    <div
      v-else-if="!loading && books.length === 0"
      class="state"
    >
      Chưa có sách trong mục này.
    </div>

    <section v-else class="books-list">
      <article
        v-for="book in books"
        :key="book.id"
        class="bookshelf-card"
        @click="openBookDetail(book)"
      >
        <div class="book-cover">
          <img
            v-if="book.coverUrl"
            :src="book.coverUrl"
            :alt="book.title"
          />

          <div v-else class="no-cover">
            No Cover
          </div>
        </div>

        <div class="book-content">
          <h2>{{ book.title }}</h2>

          <p class="author">
            {{ book.author || "Unknown author" }}
          </p>

          <div class="progress-info">
            <span>
              {{ book.currentPage }} /
              {{ book.pageCount || "?" }}
              pages
            </span>

            <strong>
              {{ getProgress(book) }}%
            </strong>
          </div>

          <div class="progress-bar">
            <div
              class="progress-value"
              :style="{
                width: `${getProgress(book)}%`,
              }"
            ></div>
          </div>

          <div class="book-dates">
        <div>
          <span>Thêm vào tủ</span>
          <strong>{{ formatDate(book.createdAt) }}</strong>
        </div>

        <div>
          <span>Bắt đầu đọc</span>
          <strong>{{ formatDate(book.startedAt) }}</strong>
        </div>

        <div>
          <span>Hoàn thành</span>
          <strong>{{ formatDate(book.finishedAt) }}</strong>
        </div>
      </div>

          <div
            class="book-actions"
            @click.stop
          >
            <label>
              Trang hiện tại

              <input
                type="number"
                step="1"
                min="0"
                :max="book.pageCount || undefined"
                :value="book.currentPage"
                @change="updatePage(book, $event)"
              />
            </label>

            <label>
              Trạng thái

              <select
                :value="book.status"
                @change="updateStatus(book, $event)"
              >
                <option value="WANT_TO_READ">
                  Muốn đọc
                </option>

                <option value="READING">
                  Đang đọc
                </option>

                <option value="COMPLETED">
                  Đã đọc
                </option>
              </select>
            </label>
          </div>

          <div
            class="book-footer"
            @click.stop
          >
            <label>
              Đánh giá

              <select
                :value="book.rating || ''"
                @change="updateRating(book, $event)"
              >
                <option value="">
                  Chưa đánh giá
                </option>

                <option value="1">
                  ⭐ 1
                </option>

                <option value="2">
                  ⭐ 2
                </option>

                <option value="3">
                  ⭐ 3
                </option>

                <option value="4">
                  ⭐ 4
                </option>

                <option value="5">
                  ⭐ 5
                </option>
              </select>
            </label>

            <label class="note-field">
              Ghi chú

              <input
                type="text"
                maxlength="1000"
                :value="book.note || ''"
                placeholder="Ghi chú ngắn..."
                @change="updateNote(book, $event)"
              />
            </label>

            <button
              class="delete-button"
              @click="deleteBook(book)"
            >
              Xoá
            </button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
```
