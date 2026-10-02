<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import {getBookDetail} from "../services/book.service.js";

import {addToBookshelf} from "../services/bookshelf.service.js";

import "../assets/book-detail.css";

const route = useRoute();
const router = useRouter();

const book = ref(null);
const loading = ref(true);
const error = ref("");

const isAdded = ref(false);
const showAddModal = ref(false);
const selectedStatus = ref("WANT_TO_READ");
const adding = ref(false);

const loadBook = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await getBookDetail(route.params.workId);
    const coverUrl = route.query.coverUrl;

    // Ưu tiên ảnh từ màn search (search và work của Open Library có thể khác cover)
    book.value = coverUrl ? { ...response.data, coverUrl } : response.data;
    isAdded.value = response.data.isAdded;
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Không thể tải thông tin sách."
    );
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  if (isAdded.value) {
    return;
  }

  selectedStatus.value = "WANT_TO_READ";
  showAddModal.value = true;
};

const closeAddModal = () => {
  if (adding.value) {
    return;
  }

  showAddModal.value = false;
};

const confirmAddToBookshelf = async () => {
  if (adding.value || !book.value) {
    return;
  }

  adding.value = true;

  try {
    await addToBookshelf({
      workId: book.value.workId,
      status: selectedStatus.value,
    });

    isAdded.value = true;
    showAddModal.value = false;

    alert("Đã thêm sách vào tủ sách.");
  } catch (err) {
    alert(
      err.response?.data?.message ||
        "Không thể thêm sách vào tủ sách."
    );
  } finally {
    adding.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  await loadBook();
});
</script>

<template>
  <div class="book-detail-page">
    <!-- Loading -->
    <div
      v-if="loading"
      class="detail-state"
    >
      <div class="state-icon">📖</div>
      <h2>Đang tải thông tin sách...</h2>
      <p>Vui lòng chờ trong giây lát.</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="detail-state detail-state-error"
    >
      <div class="state-icon">!</div>
      <h2>Không thể tải sách</h2>
      <p>{{ error }}</p>

      <button
        class="btn btn-primary"
        @click="loadBook"
      >
        Thử lại
      </button>
    </div>

    <!-- Book detail -->
    <template v-else-if="book">
      <button
        class="back-button"
        @click="goBack"
      >
        <span>←</span>
        Quay lại
      </button>

      <section class="book-detail-card">
        <!-- Cover -->
        <div class="detail-cover-wrapper">
          <div class="detail-cover">
            <img
              v-if="book.coverUrl"
              :src="book.coverUrl"
              :alt="book.title"
            />

            <div
              v-else
              class="detail-no-cover"
            >
              <span>📖</span>
              <small>No Cover</small>
            </div>
          </div>
        </div>

        <!-- Main information -->
        <div class="detail-content">
          <div class="detail-heading">
            <span
              v-if="isAdded"
              class="detail-added-badge"
            >
              ✓ Đã có trong tủ sách
            </span>

            <h1>{{ book.title }}</h1>

            <p class="detail-author">
              {{ book.authors?.join(", ") || "Unknown author" }}
            </p>
          </div>

          <div class="detail-meta">
            <div
              v-if="book.publishedYear"
              class="meta-item"
            >
              <span class="meta-label">Năm xuất bản</span>
              <strong>{{ book.publishedYear }}</strong>
            </div>

            <div
              v-if="book.pageCount"
              class="meta-item"
            >
              <span class="meta-label">Số trang</span>
              <strong>{{ book.pageCount }}</strong>
            </div>
          </div>

          <div class="detail-section">
            <h2>Mô tả</h2>

            <p
              v-if="book.description"
              class="description"
            >
              {{ book.description }}
            </p>

            <p
              v-else
              class="empty-description"
            >
              Chưa có mô tả cho cuốn sách này.
            </p>
          </div>

          <div
            v-if="book.subjects?.length"
            class="detail-section"
          >
            <h2>Chủ đề</h2>

            <div class="subjects">
              <span
                v-for="subject in book.subjects"
                :key="subject"
                class="subject-tag"
              >
                {{ subject }}
              </span>
            </div>
          </div>

          <div class="detail-action">
            <button
              v-if="!isAdded"
              class="btn btn-primary detail-add-button"
              @click="openAddModal"
            >
              <span>＋</span>
              Thêm vào tủ sách
            </button>

            <button
              v-else
              class="btn detail-added-button"
              disabled
            >
              <span>✓</span>
              Đã thêm vào tủ sách
            </button>
          </div>
        </div>
      </section>
    </template>

    <!-- Add modal -->
    <div
      v-if="showAddModal"
      class="detail-modal-overlay"
      @click.self="closeAddModal"
    >
      <div class="detail-modal">
        <div class="modal-header">
          <div>
            <h2>Thêm vào tủ sách</h2>
            <p>{{ book?.title }}</p>
          </div>

          <button
            class="modal-close"
            :disabled="adding"
            @click="closeAddModal"
          >
            ×
          </button>
        </div>

        <div class="modal-body">
          <p class="modal-description">
            Chọn trạng thái ban đầu cho cuốn sách:
          </p>

          <div class="status-options">
            <label
              class="status-option"
              :class="{
                selected:
                  selectedStatus === 'WANT_TO_READ',
              }"
            >
              <input
                v-model="selectedStatus"
                type="radio"
                value="WANT_TO_READ"
              />

              <span class="status-option-content">
                <strong>Muốn đọc</strong>
                <small>Đưa sách vào danh sách chờ đọc</small>
              </span>
            </label>

            <label
              class="status-option"
              :class="{
                selected:
                  selectedStatus === 'READING',
              }"
            >
              <input
                v-model="selectedStatus"
                type="radio"
                value="READING"
              />

              <span class="status-option-content">
                <strong>Đang đọc</strong>
                <small>Bắt đầu theo dõi tiến độ đọc</small>
              </span>
            </label>

            <label
              class="status-option"
              :class="{
                selected:
                  selectedStatus === 'COMPLETED',
              }"
            >
              <input
                v-model="selectedStatus"
                type="radio"
                value="COMPLETED"
              />

              <span class="status-option-content">
                <strong>Đã đọc</strong>
                <small>Đánh dấu sách đã hoàn thành</small>
              </span>
            </label>
          </div>
        </div>

        <div class="modal-actions">
          <button
            class="btn btn-secondary"
            :disabled="adding"
            @click="closeAddModal"
          >
            Huỷ
          </button>

          <button
            class="btn btn-primary"
            :disabled="adding"
            @click="confirmAddToBookshelf"
          >
            {{ adding ? "Đang thêm..." : "Thêm vào tủ" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
