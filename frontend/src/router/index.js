import { createRouter, createWebHistory } from "vue-router";

import SearchPage from "../pages/SearchPage.vue";
import BookDetailPage from "../pages/BookDetailPage.vue";
import BookshelfPage from "../pages/BookshelfPage.vue";

const routes = [
  {
    path: "/",
    redirect: "/search",
  },
  {
    path: "/search",
    component: SearchPage,
  },
  {
    path: "/books/:workId",
    component: BookDetailPage,
  },
  {
    path: "/bookshelf",
    component: BookshelfPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;