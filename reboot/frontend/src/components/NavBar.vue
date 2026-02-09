<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

async function logout() {
  auth.logout()
  menuOpen.value = false
  router.push('/')
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}
</script>

<template>
  <nav class="nav-bar">
    <div class="nav-left">
      <router-link to="/" class="logo-link" @click="closeMenu">
        <h1>Pixel Golf</h1>
      </router-link>
    </div>

    <!-- Desktop nav links -->
    <div class="nav-center desktop-only">
      <router-link to="/holes" class="nav-link">Holes</router-link>
      <router-link v-if="auth.isLoggedIn" to="/create-hole" class="nav-link">Create</router-link>
      <router-link v-if="auth.isLoggedIn" to="/profile" class="nav-link">Profile</router-link>
    </div>

    <div class="nav-right desktop-only">
      <template v-if="!auth.isLoggedIn">
        <router-link to="/login" class="auth-button">Login</router-link>
        <router-link to="/signup" class="auth-button primary">Sign Up</router-link>
      </template>
      <template v-else>
        <button class="auth-button" @click="logout">
          Logout {{ auth.user?.username }}
        </button>
      </template>
    </div>

    <!-- Mobile hamburger button -->
    <button
      class="hamburger mobile-only"
      :class="{ open: menuOpen }"
      @click="toggleMenu"
      aria-label="Toggle menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
  </nav>

  <!-- Mobile slide-out menu -->
  <Transition name="slide">
    <div v-if="menuOpen" class="mobile-menu mobile-only" @click.self="closeMenu">
      <div class="mobile-menu-content">
        <router-link to="/holes" class="mobile-link" @click="closeMenu">Holes</router-link>
        <router-link v-if="auth.isLoggedIn" to="/create-hole" class="mobile-link" @click="closeMenu">Create Hole</router-link>
        <router-link v-if="auth.isLoggedIn" to="/profile" class="mobile-link" @click="closeMenu">Profile</router-link>
        <hr class="mobile-divider" />
        <template v-if="!auth.isLoggedIn">
          <router-link to="/login" class="mobile-link" @click="closeMenu">Login</router-link>
          <router-link to="/signup" class="mobile-link highlight" @click="closeMenu">Sign Up</router-link>
        </template>
        <template v-else>
          <button class="mobile-link logout-btn" @click="logout">
            Logout ({{ auth.user?.username }})
          </button>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #272727;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.25rem;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.nav-left {
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
}

h1 {
  color: #ffffff;
  font-size: 1.3rem;
  margin: 0;
}

.nav-center {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #bbb;
  font-size: 0.95rem;
  transition: color 0.2s;
  padding: 0.25rem 0;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #fff;
}

.nav-right {
  display: flex;
  gap: 0.75rem;
}

.auth-button {
  padding: 0.4rem 0.85rem;
  border: 1px solid #ffffff;
  border-radius: 4px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.auth-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.auth-button.primary {
  background: #ffffff;
  color: #272727;
}

.auth-button.primary:hover {
  background: rgba(255, 255, 255, 0.9);
}

/* Hamburger button */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  z-index: 1001;
}

.hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: #fff;
  border-radius: 1px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger.open span:nth-child(2) {
  opacity: 0;
}

.hamburger.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Mobile menu overlay */
.mobile-menu {
  display: none;
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.mobile-menu-content {
  background-color: #272727;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.mobile-link {
  display: block;
  color: #ddd;
  padding: 0.9rem 1.5rem;
  font-size: 1.05rem;
  transition: background-color 0.2s;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  width: 100%;
  font-family: inherit;
}

.mobile-link:hover,
.mobile-link:active {
  background-color: #383838;
  color: #fff;
}

.mobile-link.highlight {
  color: #7c7;
}

.mobile-link.router-link-active {
  color: #fff;
  background-color: #333;
}

.logout-btn {
  color: #f77;
}

.mobile-divider {
  border: none;
  border-top: 1px solid #444;
  margin: 0.25rem 1.25rem;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.2s ease;
}
.slide-enter-active .mobile-menu-content,
.slide-leave-active .mobile-menu-content {
  transition: transform 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
}
.slide-enter-from .mobile-menu-content,
.slide-leave-to .mobile-menu-content {
  transform: translateY(-10px);
}

/* Responsive visibility */
.mobile-only {
  display: none !important;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }
  .mobile-only {
    display: flex !important;
  }
  .hamburger {
    display: flex !important;
  }
  .nav-bar {
    padding: 0 1rem;
  }
  h1 {
    font-size: 1.15rem;
  }
}
</style>
