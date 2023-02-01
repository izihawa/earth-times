import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "feed-view",
      component: () => import("./components/FeedView.vue"),
    },
    {
      path: "/:database/:url(.+)",
      name: "news-view",
      component: () => import("./components/NewsView.vue"),
    },
  ],
});

export default router;
