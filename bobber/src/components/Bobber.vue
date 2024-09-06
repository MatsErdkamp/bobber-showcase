<template>
  <div ref="sceneContainer" class="canvas-container">
    <div ref="textElement" class="text-overlay">CEE.HEALTH</div>
    <div class="gradient-overlay"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted, watch } from "vue";
import * as THREE from "three";

const sceneContainer = ref(null);
const textElement = ref(null);

onMounted(() => {
  const container = sceneContainer.value;

  // Create a new scene
  const scene = new THREE.Scene();

  // Create a perspective camera
  const camera = new THREE.PerspectiveCamera(
    35, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near plane
    1000 // Far plane
  );
  camera.position.z = 5;

  // Create a WebGL renderer with alpha enabled (for transparency)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Set clear color to black but fully transparent
  container.appendChild(renderer.domElement); // Append canvas to the container

  // Create a basic cube geometry and a material
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Use MeshStandardMaterial to interact with light
  const cube = new THREE.Mesh(geometry, material);
  cube.position.y = 4;

  // Add the cube to the scene
  scene.add(cube);

  // Add a directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light, intensity 1
  directionalLight.position.set(5, 5, 5); // Position the light above and to the right
  scene.add(directionalLight);

  // Optionally, add ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Soft white light
  scene.add(ambientLight);

  // Create a ground plane
  const groundGeometry = new THREE.PlaneGeometry(10, 10);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  ground.position.y = -1.7; // Position slightly below the cube
  scene.add(ground);

  // Function to check if cube is in the middle of the canvas
  const isCubePastMiddleOfCanvas = () => {
    // Get the cube's position in screen coordinates
    const cubeScreenPosition = cube.position.clone().project(camera);

    // Convert to normalized device coordinates (NDC)
    const ndcX = cubeScreenPosition.x;
    const ndcY = cubeScreenPosition.y;

    // Check if the cube is past the middle of the screen
    // NDC coordinates range from -1 to 1, where 0 is the center
    // We check if the cube's y position is less than 0 (below the center)
    return ndcY < 0;
  };

  // Physics variables
  const gravity = -9.8;
  let velocity = 0;
  const damping = 0.2; // Coefficient of restitution

  // Function to apply gravity and handle collision
  const applyGravity = () => {
    // Apply gravity
    velocity += gravity * 0.016; // Assuming 60 FPS, so delta time is roughly 1/60
    cube.position.y += velocity * 0.016;

    // Check for collision with ground
    if (cube.position.y - 0.5 < ground.position.y) {
      // 0.5 is half the cube's height
      cube.position.y = ground.position.y + 0.5; // Place cube on top of ground
      velocity = -velocity * damping; // Reverse and dampen velocity

      // Stop bouncing when velocity becomes very small
      if (Math.abs(velocity) < 0.1) {
        velocity = 0;
      }
    }
  };

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    // Apply gravity in each frame
    applyGravity();

    if (textElement.value) {
      textElement.value.style.opacity = isCubePastMiddleOfCanvas() ? 0 : 1;
    }

    // Render the scene from the perspective of the camera
    renderer.render(scene, camera);
  };

  animate();

  // Update canvas size on window resize
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", onWindowResize);

  // Clean up when the component is unmounted
  onUnmounted(() => {
    window.removeEventListener("resize", onWindowResize);
    renderer.dispose();
  });
});
</script>

<style scoped>
.canvas-container {
  position: fixed;
  background: rgb(246, 220, 189);
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.text-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: bold;
  color: black;
  z-index: -1;
}

.gradient-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100px;
  background: linear-gradient(
    to top,
    rgb(189, 222, 246),
    rgba(246, 220, 189, 0)
  );
  z-index: 1000;
  pointer-events: none;
}
</style>
