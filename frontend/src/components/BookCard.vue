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

    <div class="book-cover" @click="$emit('view', book)">
      <img
        v-if="book.coverUrl"
        :src="book.coverUrl"
        :alt="book.title"/>
      <div v-else class="no-cover"> 
        No Cover
      </div>
    </div>

    <div class="book-info">
      <h3>{{ book.title }}</h3>
      <p class="author">
        {{ book.author || "Unknown author" }}
      </p>

      <p class="year">
        {{ book.publishedYear || "Unknown year" }}
      </p>

      <button :disabled="isAdded" @click="$emit('add', book)">
        {{ isAdded ? "Đã thêm" : "Add to Shelf" }}
      </button>

    </div>

  </div>
</template>