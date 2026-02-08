import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignupView.vue')
    },
    {
      path: '/holes',
      name: 'holes',
      component: () => import('@/views/HolesView.vue')
    },
    {
      path: '/play/hole/:id',
      name: 'play-hole',
      component: () => import('@/views/PlayHoleView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue')
    },
    {
      path: '/replay/:id',
      name: 'replay',
      component: () => import('@/views/ReplayView.vue')
    }
  ]
})

export default router
