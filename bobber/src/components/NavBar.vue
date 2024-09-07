<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <a to="/" class="navbar-item">{{ brandName }}</a>
    </div>
    <div class="navbar-menu">
      <a
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="navbar-item"
      >
        {{ item.name }}
      </a>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";

const brandName = ref("BathBobber");

const menuItems = ref([
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
]);
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 1rem 0 80px;
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: min(1400px, 100vw);
  z-index: 1000;
  color: #050505;
}

a {
  all: unset;
}

.navbar-brand {
  font-size: 1.5rem;
  font-weight: bold;
}

.navbar-menu {
  display: flex;
  gap: 1rem;
}

.navbar-item {
  text-decoration: none;
  transition: color 0.3s ease;
}
</style>
