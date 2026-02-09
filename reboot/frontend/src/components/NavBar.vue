<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

async function logout() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <nav class="nav-bar">
    <div class="nav-left">
      <router-link to="/" class="logo-link">
        <h1>Pixel Golf</h1>
      </router-link>
      <div class="dropdown">
        <button class="dropdown-btn">Menu</button>
        <div class="dropdown-content">
          <router-link to="/holes">Holes</router-link>
          <router-link v-if="auth.isLoggedIn" to="/create-hole">Create Hole</router-link>
          <router-link v-if="auth.isLoggedIn" to="/profile">Profile</router-link>
        </div>
      </div>
    </div>
    <div class="nav-right">
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
  </nav>
</template>

<style scoped>
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #272727;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-link {
  text-decoration: none;
}

h1 {
  color: #ffffff;
  font-size: 1.5rem;
  margin: 0;
}

.nav-right {
  display: flex;
  gap: 1rem;
}

.auth-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ffffff;
  border-radius: 4px;
  background: transparent;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
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

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-btn {
  padding: 0.5rem 1rem;
  background: transparent;
  color: #ffffff;
  border: 1px solid #ffffff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.dropdown-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-content {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #272727;
  min-width: 160px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  z-index: 1001;
}

.dropdown:hover .dropdown-content {
  display: block;
}

.dropdown-content a {
  color: #ffffff;
  padding: 12px 16px;
  display: block;
  transition: background-color 0.2s;
}

.dropdown-content a:hover {
  background-color: #383838;
}

@media (max-width: 768px) {
  .nav-bar {
    padding: 0 1rem;
  }
}
</style>
