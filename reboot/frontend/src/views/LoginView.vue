<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')

async function handleLogin() {
  error.value = ''
  try {
    await auth.login(username.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Login failed'
  }
}
</script>

<template>
  <div class="page-container">
    <div class="content-wrapper">
      <div class="form-container">
        <h1>Sign In</h1>
        <p v-if="error" class="error">{{ error }}</p>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" v-model="username" type="text" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" v-model="password" type="password" required />
          </div>
          <button type="submit">Sign In</button>
        </form>
        <p class="signup-link">
          Don't have an account?
          <router-link to="/signup">Sign up</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #1a1a1a;
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.content-wrapper {
  max-width: 400px;
  width: 100%;
}

.form-container {
  background-color: #272727;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
}

h1 {
  color: #ffffff;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #ffffff;
  font-size: 1rem;
  -webkit-appearance: none;
}

input:focus {
  outline: none;
  border-color: #666;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4a4a4a;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
  -webkit-tap-highlight-color: transparent;
}

button:hover {
  background-color: #5a5a5a;
}

button:active {
  background-color: #666;
}

.error {
  color: #ff5757;
  margin-bottom: 1rem;
  text-align: center;
}

.signup-link {
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
}

.signup-link a {
  color: #999;
  margin-left: 0.5rem;
}

.signup-link a:hover {
  color: #ccc;
}

@media (max-width: 480px) {
  .page-container {
    padding: 1rem 0.75rem;
    align-items: flex-start;
    padding-top: 80px;
  }

  .form-container {
    padding: 1.5rem;
  }
}
</style>
