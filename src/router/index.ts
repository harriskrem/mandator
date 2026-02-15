import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/home/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
  ],
})

export default router
