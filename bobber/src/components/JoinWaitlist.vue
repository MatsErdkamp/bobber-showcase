<template>
  <div class="join-waitlist-form">
    <h2>Join the Waitlist</h2>
    <form @submit.prevent="submitForm">
      <input
        type="email"
        v-model="email"
        placeholder="Enter your email"
        required
      />
      <button type="submit">Join Now</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";

const email = ref("");

function submitForm() {
  // Handle form submission here
  console.log("Submitted email:", email.value);
  // You would typically send this to your backend or a service
}
</script>

<style scoped>
.join-waitlist-form {
  color: white;
  text-align: center;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 40vh;
  width: min(400px, 50vw);
  z-index: 100;
}

form {
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  min-width: 100%;
}

input {
  padding: 16px;
  border-radius: 32px;
  border: 1px solid #212121;
}

button {
  background-color: #ff9000;
  color: #fff;
  border: none;
  padding: 12px 16px;
  min-width: 100%;
  border-radius: 36px;
  cursor: pointer;
  display: block;
  margin-left: auto;
  margin-right: auto;
  text-wrap: pretty;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 6px rgba(0, 0, 0, 0.08),
    inset 0 -2px 5px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(0, 0, 0, 0.1);
  position: relative;
  top: 0;
  font-weight: 600;
}

button:hover {
  background-color: #ce7e16;
}
</style>
