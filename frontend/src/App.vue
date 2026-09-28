<script setup>
import {onMounted} from "vue";
import SearchPage from "./pages/SearchPage.vue";
import "./assets/styles/app.css";
import AppHeader from "./components/AppHeader.vue";
</script>

<template>
  <AppHeader />
  <main class="app-main">
    <router-view />
  </main>
</template>
