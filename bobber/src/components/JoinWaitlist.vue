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
  left: 25vw;
  height: 40vh;
  width: 50vw;

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
  padding: 12px;
  border-radius: 16px;
  border: 1px solid white;
}

button {
  padding: 12px 20px;
  background-color: #ff6600;
  color: white;
  min-width: 100%;
  border-radius: 16px;
  border: none;
  cursor: pointer;
}
</style>
