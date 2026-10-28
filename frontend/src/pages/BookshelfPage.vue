<script setup>
import { onMounted, ref, onBeforeUnmount } from "vue";
import {
  getBookshelf,
  updateBookshelfBook,
  deleteBookshelfBook,
} from "../services/bookshelf.service.js";
import { useRouter } from "vue-router";

import "../assets/bookshelf.css";

const router = useRouter();

const books = ref([]);
const statistics = ref({
  total: 0,
  wantToRead: 0,
  reading: 0,
  completed: 0,
});

const activeStatus = ref("");
const loading = ref(false);

// Timer debounce theo từng book
const pageUpdateTimers = new Map();
// Version theo từng book: dùng để bỏ qua response cũ khi người dùng đã gõ tiếp
const pageRequestVersion = new Map();

const PAGE_DEBOUNCE_MS = 600;

const statusTabs = [
  { value: "", label: "Tất cả" },
  { value: "WANT_TO_READ", label: "Muốn đọc" },
  { value: "READING", label: "Đang đọc" },
  { value: "COMPLETED", label: "Đã đọc" },
];

// Status -> field tương ứng trong statistics
const STATISTIC_KEYS = {
  WANT_TO_READ: "wantToRead",
  READING: "reading",
  COMPLETED: "completed",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const getErrorMessage = (err, fallback) => {
  if (!err.response) {
    return "Không thể kết nối đến máy chủ. Vui lòng thử lại.";
  }

  if (err.response.status >= 500) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
  }

  return err.response.data?.message || fallback;
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

/**
 * Gộp dữ liệu từ server vào book.
 * Nếu người dùng đang gõ dở số trang (còn timer chờ gửi),
 * giữ nguyên currentPage để input không bị ghi đè / nhảy số.
 */
const applyServerBook = (book, serverBook) => {
  const { currentPage, ...rest } = serverBook;

  Object.assign(book, rest);

  if (!pageUpdateTimers.has(book.id)) {
    book.currentPage = currentPage;
  }
};

/* -------------------------------------------------------------------------- */
/* Load / filter                                                              */
/* -------------------------------------------------------------------------- */

const loadBookshelf = async () => {
  loading.value = true;

  try {
    const response = await getBookshelf(activeStatus.value);

    books.value = response.data.books;
    statistics.value = response.data.statistics;
  } catch (err) {
    alert(
      getErrorMessage(err, "Không thể tải tủ sách. Vui lòng thử lại.")
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

/* -------------------------------------------------------------------------- */
/* Statistics (cập nhật tại chỗ, không cần gọi lại API)                      */
/* -------------------------------------------------------------------------- */

const changeStatistic = (status, delta) => {
  const key = STATISTIC_KEYS[status];

  statistics.value[key] = Math.max(0, statistics.value[key] + delta);
};

/**
 * Gọi sau khi status của book có thể đã đổi (backend có thể tự đổi status,
 * vd: đọc đến trang cuối -> COMPLETED): cập nhật thống kê và
 * gỡ sách khỏi danh sách nếu không còn khớp tab đang lọc.
 */
const handleStatusChange = (book, oldStatus) => {
  if (book.status === oldStatus) {
    return;
  }

  changeStatistic(oldStatus, -1);
  changeStatistic(book.status, +1);

  if (activeStatus.value !== "" && book.status !== activeStatus.value) {
    books.value = books.value.filter((item) => item.id !== book.id);
  }
};

/* -------------------------------------------------------------------------- */
/* Cập nhật số trang (debounce, chỉ báo lỗi khi rời ô nhập)                   */
/* -------------------------------------------------------------------------- */

/**
 * Kiểm tra giá trị trong ô nhập số trang.
 * Trả về { valid: true, value } hoặc { valid: false, message }.
 */
const validatePageInput = (book, input) => {
  const raw = input.value.trim();

  // type="number" trả về "" khi nhập ký tự không hợp lệ (vd: "e", "1e")
  if (raw === "" || input.validity.badInput) {
    return { valid: false, message: "Vui lòng nhập số trang hợp lệ." };
  }

  if (!/^\d+$/.test(raw)) {
    return {
      valid: false,
      message: "Số trang phải là số nguyên không âm.",
    };
  }

  const value = Number(raw);

  if (book.pageCount && value > book.pageCount) {
    return {
      valid: false,
      message: `Số trang không được vượt quá ${book.pageCount}.`,
    };
  }

  return { valid: true, value };
};

const updatePage = (book, event) => {
  const result = validatePageInput(book, event.target);

  // Đang gõ sai: không alert, không gửi request.
  // Lỗi sẽ được báo khi người dùng rời ô nhập (blur).
  if (!result.valid) {
    return;
  }

  const currentPage = result.value;

  // Cập nhật UI ngay lập tức (progress bar chạy mượt)
  book.currentPage = currentPage;

  // Huỷ timer cũ của book này
  clearTimeout(pageUpdateTimers.get(book.id));

  // Tăng version để response cũ không ghi đè lên giá trị mới
  const version = (pageRequestVersion.get(book.id) || 0) + 1;
  pageRequestVersion.set(book.id, version);

  const isLatest = () => pageRequestVersion.get(book.id) === version;

  const timer = setTimeout(async () => {
    try {
      const response = await updateBookshelfBook(book.id, { currentPage });

      // Đã có lần gõ mới hơn -> bỏ qua response này
      if (!isLatest()) {
        return;
      }

      // Đây là response mới nhất nên lấy luôn currentPage từ server
      const oldStatus = book.status;
      Object.assign(book, response.data);
      handleStatusChange(book, oldStatus);
    } catch (err) {
      if (!isLatest()) {
        return;
      }

      alert(getErrorMessage(err, "Không thể cập nhật số trang."));

      // Đồng bộ lại với backend
      await loadBookshelf();
    } finally {
      // Hết gõ dở: các response khác (status, rating...) được phép ghi currentPage
      if (isLatest()) {
        pageUpdateTimers.delete(book.id);
      }
    }
  }, PAGE_DEBOUNCE_MS);

  pageUpdateTimers.set(book.id, timer);
};

/**
 * Khi rời ô nhập: nếu giá trị sai thì báo lỗi một lần,
 * rồi trả ô nhập về số trang hợp lệ gần nhất.
 */
const normalizePageInput = (book, event) => {
  const input = event.target;
  const result = validatePageInput(book, input);

  if (result.valid) {
    input.value = result.value;
    return;
  }

  // Trả giá trị về trước, rồi mới alert
  input.value = book.currentPage;

  alert(result.message);
};

/* -------------------------------------------------------------------------- */
/* Các cập nhật khác: status, rating, note                                    */
/* -------------------------------------------------------------------------- */

/**
 * Gửi update lên server rồi gộp kết quả vào book.
 * Lỗi thì báo cho người dùng; book giữ nguyên giá trị cũ.
 */
const saveBook = async (book, data, fallbackMessage) => {
  const oldStatus = book.status;

  try {
    const response = await updateBookshelfBook(book.id, data);

    applyServerBook(book, response.data);
    handleStatusChange(book, oldStatus);
  } catch (err) {
    alert(getErrorMessage(err, fallbackMessage));
  }
};

// Sau khi lưu (thành công hay lỗi), luôn đưa ô nhập về đúng giá trị của book.
// Vd: backend giữ COMPLETED khi sách đang ở trang cuối thì select phải hiện lại "Đã đọc".

const updateStatus = async (book, event) => {
  await saveBook(book, { status: event.target.value }, "Không thể cập nhật trạng thái.");

  event.target.value = book.status;
};

const updateRating = async (book, event) => {
  const value = event.target.value;

  await saveBook(book, { rating: value === "" ? null : Number(value) }, "Không thể cập nhật đánh giá.");

  event.target.value = book.rating ?? "";
};

const updateNote = async (book, event) => {
  const note = event.target.value.trim();

  await saveBook(book, { note: note || null }, "Không thể cập nhật ghi chú.");

  event.target.value = book.note ?? "";
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

    // Huỷ timer đang chờ của sách này (nếu có)
    clearTimeout(pageUpdateTimers.get(book.id));
    pageUpdateTimers.delete(book.id);
    pageRequestVersion.delete(book.id);

    books.value = books.value.filter((item) => item.id !== book.id);

    statistics.value.total = Math.max(0, statistics.value.total - 1);
    changeStatistic(book.status, -1);
  } catch (err) {
    alert(getErrorMessage(err, "Không thể xoá sách. Vui lòng thử lại."));
  }
};

const openBookDetail = (book) => {
  router.push(`/books/${book.workId}`);
};

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */

onBeforeUnmount(() => {
  for (const timer of pageUpdateTimers.values()) {
    clearTimeout(timer);
  }

  pageUpdateTimers.clear();
  pageRequestVersion.clear();
});

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

    <div v-if="loading && books.length === 0" class="state">
      Đang tải tủ sách...
    </div>

    <div v-else-if="!loading && books.length === 0" class="state">
      Chưa có sách trong mục này.
    </div>

    <section v-else class="books-list">
      <article v-for="book in books" :key="book.id" class="bookshelf-card">
        <div
          class="book-cover clickable"
          role="link"
          tabindex="0"
          @click="openBookDetail(book)"
          @keydown.enter="openBookDetail(book)"
        >
          <img v-if="book.coverUrl" :src="book.coverUrl" :alt="book.title" />

          <div v-else class="no-cover">No Cover</div>
        </div>

        <div class="book-content">
          <h2
            class="book-title clickable"
            role="link"
            tabindex="0"
            @click="openBookDetail(book)"
            @keydown.enter="openBookDetail(book)"
          >
            {{ book.title }}
          </h2>

          <p class="author">
            {{ book.author || "Unknown author" }}
          </p>

          <div class="progress-info">
            <span>
              {{ book.currentPage }} /
              {{ book.pageCount || "?" }}
              pages
            </span>

            <strong>{{ getProgress(book) }}%</strong>
          </div>

          <div class="progress-bar">
            <div
              class="progress-value"
              :style="{ width: `${getProgress(book)}%` }"
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

          <div class="book-actions" @click.stop>
            <label>
              Trang hiện tại

              <input
                type="number"
                step="1"
                min="0"
                :max="book.pageCount || undefined"
                :value="book.currentPage"
                @input="updatePage(book, $event)"
                @blur="normalizePageInput(book, $event)"
              />
            </label>

            <label>
              Trạng thái

              <select :value="book.status" @change="updateStatus(book, $event)">
                <option value="WANT_TO_READ">Muốn đọc</option>
                <option value="READING">Đang đọc</option>
                <option value="COMPLETED">Đã đọc</option>
              </select>
            </label>
          </div>

          <div class="book-footer" @click.stop>
            <label>
              Đánh giá

              <select
                :value="book.rating || ''"
                @change="updateRating(book, $event)"
              >
                <option value="">Chưa đánh giá</option>
                <option value="1">⭐ 1</option>
                <option value="2">⭐ 2</option>
                <option value="3">⭐ 3</option>
                <option value="4">⭐ 4</option>
                <option value="5">⭐ 5</option>
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

            <button class="delete-button" @click="deleteBook(book)">
              Xoá
            </button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
/* Chỉ ảnh bìa và tên sách mới dẫn tới trang chi tiết */
.bookshelf-card {
  cursor: default;
}

.clickable {
  cursor: pointer;
}

.book-title.clickable:hover {
  text-decoration: underline;
}
</style>
