<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/" class="navbar-item">{{ brandName }}</router-link>
    </div>
    <div class="navbar-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="navbar-item"
      >
        {{ item.name }}
      </router-link>
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
  justify-content: space-between;
  align-items: center;
  padding: 1rem 25vw 80px;
  position: fixed;
  top: 0;

  width: 50vw;
  right: 0;
  z-index: 1000;
  color: #050505;
  /* background: linear-gradient(to bottom, #f5f4ee 50%, #f5f4ee00); */
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
