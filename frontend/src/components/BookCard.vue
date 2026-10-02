<script setup>
defineProps({
  book: {
    type: Object,
    required: true,
  },
  isAdded: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["add", "view"]);
</script>

<template>
    <div class="book-card">

    <div class="book-card-cover" @click="$emit('view', book)">
      <img
        v-if="book.coverUrl"
        :src="book.coverUrl"
        :alt="book.title"/>
      <div v-else class="book-card-no-cover">
        <span>📖</span>
        <small>No Cover</small>
      </div>
    </div>

    <div class="book-card-content">
      <h3 class="book-card-title">{{ book.title }}</h3>
      <p class="book-card-author">
        {{ book.author || "Unknown author" }}
      </p>

      <p class="book-card-year">
        {{ book.publishedYear || "Unknown year" }}
      </p>

      <div class="book-card-footer">
        <span v-if="isAdded" class="book-added-badge">
         ✓ Đã thêm vào tủ
        </span>

        <button
          v-else
          class="book-add-button"
          @click="$emit('add', book)"
       >
        Thêm vào tủ
       </button>
      </div>
   

    </div>

  </div>
</template>
