<script setup>
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

const goToSearch = () => {
  router.push("/search");
};

const goToBookshelf = () => {
  router.push("/bookshelf");
};

const isActive = (path) => {
  return route.path === path;
};
</script>

<template>
  <header class="app-header">
    <div class="header-container">
      <button class="brand" @click="goToSearch">
        <span class="brand-icon">📚</span>
        <span>Reading Tracker</span>
      </button>

      <nav class="main-navigation">
        <button
          class="nav-link"
          :class="{ active: isActive('/search') }"
          @click="goToSearch"
        >
          Tìm sách
        </button>

        <button
          class="nav-link"
          :class="{ active: isActive('/bookshelf') }"
          @click="goToBookshelf"
        >
          Tủ sách
        </button>
      </nav>
    </div>
  </header>
</template>