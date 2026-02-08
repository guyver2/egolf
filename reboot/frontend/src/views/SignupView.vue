<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

async function handleSignup() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  try {
    await auth.signup(username.value, email.value, password.value)
    router.push('/login')
  } catch (e: any) {
    error.value = e.message || 'Signup failed'
  }
}
</script>

<template>
  <div class="page-container">
    <div class="content-wrapper">
      <div class="form-container">
        <h1>Sign Up</h1>
        <p v-if="error" class="error">{{ error }}</p>
        <form @submit.prevent="handleSignup">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" v-model="username" type="text" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" v-model="password" type="password" required />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" v-model="confirmPassword" type="password" required />
          </div>
          <button type="submit">Sign Up</button>
        </form>
        <p class="login-link">
          Already have an account?
          <router-link to="/login">Sign in</router-link>
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
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #333;
  color: #ffffff;
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
}

button:hover {
  background-color: #5a5a5a;
}

.error {
  color: #ff5757;
  margin-bottom: 1rem;
  text-align: center;
}

.login-link {
  margin-top: 1rem;
  text-align: center;
  color: #ffffff;
}

.login-link a {
  color: #999;
  margin-left: 0.5rem;
}

.login-link a:hover {
  color: #ccc;
}
</style>
