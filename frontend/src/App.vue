<script setup>
import "./assets/main.css";
</script>

<template>
  <header class="app-header">
    <div class="app-header-inner">
      <router-link
        to="/search"
        class="app-logo"
      >
        <span class="app-logo-icon">📖</span>
        <span>Reading Tracker</span>
      </router-link>

      <nav class="app-nav">
        <router-link
          to="/search"
          class="app-nav-link"
        >
          Tìm sách
        </router-link>

        <router-link
          to="/bookshelf"
          class="app-nav-link"
        >
          Tủ sách
        </router-link>
      </nav>
    </div>
  </header>

  <main class="app-main">
    <router-view />
  </main>
</template>
