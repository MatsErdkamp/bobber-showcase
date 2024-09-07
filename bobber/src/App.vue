<template>
  <div class="page-container" @mousemove="updateCanDrag">
    <Transition name="fade">
      <NavBar v-if="isBobberPastMiddle" />
    </Transition>
    <div ref="sceneContainer" class="canvas-container">
      <img
        ref="textElement"
        src="./assets/cee_logo.svg"
        alt="CEE.HEALTH"
        class="text-overlay"
        width="200"
      />
      <div class="gradient-overlay"></div>
      <div class="gradient-overlay-2"></div>
    </div>

    <Transition name="fade">
      <div
        class="text-container"
        v-if="isBobberPastMiddle && isRocketLaunched == false"
        id="text-container"
      >
        <div class="text-section">
          <h2>Launch your cold plunge journey</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam
            auctor, nunc id aliquam tincidunt, nisi nunc tincidunt nunc, vitae
            aliquam nunc nunc vitae. Duis aute irure dolor in reprehenderit in
            voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
          <!-- <img
            src="./assets/cee_logo_star.svg"
            alt="CEE.HEALTH"
            class="logo-star"
            width="200"
          /> -->
        </div>

        <div class="text-section">
          <h2>Gallery</h2>
          <img src="./assets/cee-sea.png" alt="cee-sea" />
          <!-- <img src="./assets/timer-functions.png" alt="timer-functions" /> -->
        </div>

        <div class="text-section">
          <h2>What are you waiting for?</h2>

          <p>
            Cillum mollit veniam est exercitation dolore amet irure laboris
            irure esse anim esse ad. Enim ex id id eu. Sunt dolor sit deserunt
            consequat laborum consequat.
          </p>
          <button class="buy-now-button" @click="startRocketLaunch">
            Embark on your cold plunge journey
          </button>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <JoinWaitlist v-if="showWaitlistForm" />
    </Transition>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted, watch, computed } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import bobberModel from "./assets/Models/bobber-real.glb";
import NavBar from "./components/NavBar.vue";
import {
  ShaderMaterial,
  CubeTextureLoader,
  BackSide,
  SphereGeometry,
  Mesh,
} from "three";
import pxTexture from "./assets/hdri/sea_three/px.png";
import nxTexture from "./assets/hdri/sea_three/nx.png";
import pyTexture from "./assets/hdri/sea_three/py.png";
import nyTexture from "./assets/hdri/sea_three/ny.png";
import pzTexture from "./assets/hdri/sea_three/pz.png";
import nzTexture from "./assets/hdri/sea_three/nz.png";
import JoinWaitlist from "./components/JoinWaitlist.vue";
import { createSeaMaterial } from "./components/js/seaMaterial";
import { createStarMaterial } from "./components/js/starMaterial";

const sceneContainer = ref(null);
const textElement = ref(null);
const isBobberPastMiddle = ref(false);
const isAnimating = ref(false);
const isRocketLaunched = ref(false);
const showWaitlistForm = ref(false);
const canDrag = ref(false);
let seaMaterial = null;
let bobber = null;
let scene;
let starField;
let starMaterial;
const isDragging = ref(false);
const dragStartPosition = ref(new THREE.Vector2());
const bobberStartPosition = ref(new THREE.Vector3());
let renderer;
let camera;
let dragPlane;
let raycaster;
const isMouseDown = ref(false);

const cursorStyle = computed(() => {
  if (!canDrag.value) return "default";
  return isMouseDown.value ? "grabbing" : "grab";
});

const updateCanDrag = (event) => {
  if (bobber && camera && renderer) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Get the current mouse position
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(bobber, true);

    canDrag.value = intersects.length > 0;
  }
};

onMounted(() => {
  const container = sceneContainer.value;

  // Create a new scene
  scene = new THREE.Scene();

  // Create a WebGL renderer with alpha enabled (for transparency)
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Set clear color to black but fully transparent
  container.appendChild(renderer.domElement); // Append canvas to the container
  renderer.domElement.style.position = "fixed";
  renderer.domElement.style.bottom = "0";

  // Create a perspective camera
  camera = new THREE.PerspectiveCamera(
    20, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near plane
    1000 // Far plane
  );
  camera.position.z = 10;

  // Load the bobber.glb model
  const loader = new GLTFLoader();
  let bobberMaterials;
  loader.load(
    bobberModel,
    (gltf) => {
      bobber = gltf.scene; // Assign to the global bobber variable
      bobber.position.y = 4;
      bobber.scale.set(18, 18, 18);

      // Load environment map
      const cubeTextureLoader = new CubeTextureLoader();
      const environmentMap = cubeTextureLoader.load([
        nxTexture,
        pxTexture,
        nyTexture,
        pyTexture,
        nzTexture,
        pzTexture,
      ]);

      // Set the environment map to the scene
      scene.environment = environmentMap;
      // scene.background = environmentMap; // Optional: if you want the environment map as background

      // Apply environment map to bobber materials
      bobber.traverse((child) => {
        if (child.isMesh) {
          child.material.envMap = environmentMap;
          child.material.envMapIntensity = 1.5; // Adjust as needed
          child.material.needsUpdate = true;
        }
      });

      scene.add(bobber);

      // bobberMaterials = bobber.children[0].children[1].material;

      // Create sea material here, after environmentMap is loaded
      seaMaterial = createSeaMaterial(environmentMap);
      const seaGeometry = new THREE.PlaneGeometry(10, 10, 400, 400);
      const sea = new THREE.Mesh(seaGeometry, seaMaterial);
      sea.rotation.x = -Math.PI / 2; // Rotate to be horizontal
      sea.position.y = -1.5; // Position slightly above the ground
      scene.add(sea);

      // Add a directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light, intensity 1
      directionalLight.position.set(0, 5, 5); // Position the light above and to the right
      scene.add(directionalLight);

      // Create star shader material
      starMaterial = createStarMaterial();

      // Create a large sphere for the star field
      const starGeometry = new SphereGeometry(50, 64, 64);
      starField = new Mesh(starGeometry, starMaterial);
      // Don't add to scene yet, we'll do that when the rocket launches

      // Function to check if bobber is in the middle of the canvas
      const isBobberPastMiddleOfCanvas = () => {
        if (!bobber || isAnimating.value) return false;
        const bobberScreenPosition = bobber.position.clone().project(camera);
        const ndcY = bobberScreenPosition.y;

        if (ndcY < -5) return;

        isBobberPastMiddle.value = ndcY < -0.2;
      };
      // Separate function for subtle rotation
      const applySubtleRotation = (() => {
        let rotationTimer = 0;
        const rotationSpeed = 0.016; // Adjust this value to change the rotation speed

        return () => {
          if (!bobber) return;

          rotationTimer += rotationSpeed;

          bobber.rotation.x = Math.sin(rotationTimer * 3) * 0.03;
          bobber.rotation.y = Math.sin(rotationTimer) * 0.09;
          bobber.rotation.z = Math.cos(rotationTimer) * 0.07;
          bobber.position.x += Math.sin(rotationTimer * 0.5 - 0.9) * 0.003;
          bobber.position.z += Math.cos(rotationTimer * 0.48) * 0.002;
        };
      })();

      // Physics variables
      const gravity = -9.8;
      let velocity = 0;
      const damping = 0.2; // Coefficient of restitution

      // Function to calculate wave height
      const getWaveHeight = (x, z, time) => {
        const amp = 0.05;
        const freq = 2.0;
        return (
          amp * Math.sin(x * freq + time) + amp * Math.sin(z * freq + time)
        );
      };

      // Separate function for gravity and buoyancy
      const applyGravity = () => {
        if (!bobber) return;

        // Apply gravity
        velocity += gravity * 0.016;
        bobber.position.y += velocity * 0.016;

        // Calculate wave height at bobber's position
        const waveHeight = getWaveHeight(
          bobber.position.x,
          bobber.position.z,
          seaMaterial.uniforms.time.value
        );
        const seaLevel = sea.position.y + waveHeight;

        // Check for collision with sea
        if (bobber.position.y < seaLevel - 0.28) {
          bobber.position.y = seaLevel - 0.28;
          velocity = -velocity * damping;

          // Apply buoyancy force
          const buoyancyForce = 9.8 * 0.02; // Adjust this value to change floating behavior
          velocity += buoyancyForce;

          // Stop bouncing when velocity becomes very small
          if (Math.abs(velocity) < 0.01) {
            velocity = 0;
          }
        }
      };

      let animationId;

      const animate = () => {
        requestAnimationFrame(animate);

        if (!isAnimating.value && isRocketLaunched.value == false) {
          if (!isDragging.value) {
            // Apply gravity and floating only when not dragging
            if (seaMaterial.uniforms.time.value > 1) {
              applyGravity();
            }
          }
        }

        if (!isDragging.value) {
          applySubtleRotation();
        }

        // Update water shader time
        seaMaterial.uniforms.time.value += 0.01;

        // Update star shader time
        if (starMaterial) {
          starMaterial.uniforms.time.value += 0.016; // Assuming 60 FPS
        }

        if (isBobberPastMiddle.value == false) {
          isBobberPastMiddleOfCanvas();
        }

        if (textElement.value) {
          textElement.value.style.opacity =
            isBobberPastMiddle.value || isRocketLaunched.value == true ? 0 : 1;
        }

        // Render the scene from the perspective of the camera
        renderer.render(scene, camera);
      };

      // Function to animate sea and bobber
      const animateSeaDown = () => {
        if (seaMaterial && seaMaterial.uniforms && bobber) {
          const startSeaY = 0;
          const endSeaY = -10;
          const startBobberY = bobber.position.y;
          const endBobberY = startBobberY + 1.65; // Adjust this value to control how high the bobber goes
          const duration = 3000; // 5 seconds
          const startTime = Date.now();

          const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);

            // Use easeOutCubic for smoother animation
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOutCubic(progress);

            const newSeaY = startSeaY + (endSeaY - startSeaY) * easedProgress;
            const newBobberY =
              startBobberY + (endBobberY - startBobberY) * easedProgress;

            // Update the sea position
            seaMaterial.uniforms.seaPosition.value = new THREE.Vector3(
              0,
              newSeaY,
              0
            );

            // Update the bobber position
            bobber.position.y = newBobberY;

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              isAnimating.value = false;
            }
          };

          animate();
        }
      };

      // Expose animateSeaDown to the component's scope
      window.animateSeaDown = animateSeaDown;

      // Create a plane for dragging
      dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

      raycaster = new THREE.Raycaster();

      // Set up event listeners on the sceneContainer instead of the renderer.domElement
      window.addEventListener("pointerdown", onInteractionStart);
      window.addEventListener("pointermove", onInteractionMove);
      window.addEventListener("pointerup", onInteractionEnd);
      window.addEventListener("pointercancel", onInteractionEnd);
      window.addEventListener("mousedown", onMouseDown);

      animate();
    },
    undefined,
    (error) => {
      console.error("An error happened while loading the model:", error);
    }
  );

  let originalHeight = window.innerHeight;

  // Update canvas size on window resize
  const onWindowResize = () => {
    // Check if it's a real resize or just the mobile viewport changing

    camera.aspect = window.innerWidth / originalHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, originalHeight);

    // Update star material uniforms
    if (starMaterial) {
      const maxDimension = Math.max(window.innerWidth, window.innerHeight);
      starMaterial.uniforms.resolution.value.set(maxDimension, maxDimension);
      starMaterial.uniforms.aspect.value =
        window.innerWidth / window.innerHeight;
    }
  };

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("orientationchange", onWindowResize);

  // Clean up when the component is unmounted
  onUnmounted(() => {
    window.removeEventListener("resize", onWindowResize);
    window.removeEventListener("orientationchange", onWindowResize);

    renderer.dispose();

    if (starMaterial) {
      starMaterial.dispose();
    }
    if (starField) {
      starField.geometry.dispose();
    }

    // Remove event listeners
    if (sceneContainer.value) {
      window.removeEventListener("pointerdown", onInteractionStart);
    }
    window.removeEventListener("pointermove", onInteractionMove);
    window.removeEventListener("pointerup", onInteractionEnd);
    window.removeEventListener("pointercancel", onInteractionEnd);

    window.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mouseup", onMouseUp);
  });
});

function onInteractionStart(event) {
  if (!bobber || !renderer || !camera) return;

  const interactionPosition = getInteractionPosition(event);
  raycaster.setFromCamera(interactionPosition, camera);

  const intersects = raycaster.intersectObject(bobber, true);

  if (intersects.length > 0) {
    isDragging.value = true;
    dragStartPosition.value.copy(interactionPosition);
    bobberStartPosition.value.copy(bobber.position);
  }
}

function onInteractionMove(event) {
  if (!isDragging.value || !bobber) return;

  const interactionPosition = getInteractionPosition(event);
  const dragDelta = interactionPosition.sub(dragStartPosition.value);

  const newPosition = bobberStartPosition.value.clone();
  newPosition.x += dragDelta.x * 2.5;
  newPosition.y += dragDelta.y * 2;

  bobber.position.copy(newPosition);
  event.preventDefault();
}

const onMouseDown = () => {
  isMouseDown.value = true;
};

function onInteractionEnd() {
  isDragging.value = false;
  isMouseDown.value = false;
  canDrag.value = false;
}

function getInteractionPosition(event) {
  if (!renderer) return new THREE.Vector2();

  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  return new THREE.Vector2(x, y);
}

function startRocketLaunch() {
  isRocketLaunched.value = true;

  const canvasContainer = document.querySelector(".canvas-container");
  if (canvasContainer) {
    canvasContainer.style.transition = "background-color 5s ease";
    canvasContainer.style.background = "#030308";
  }

  // Set text-container opacity to 0
  const textContainer = document.querySelector(".text-container");
  if (textContainer) {
    textContainer.style.transition = "opacity 1s ease";
    textContainer.style.opacity = "0";
  }

  // Fade out gradient overlays
  const gradientOverlays = document.querySelectorAll(
    ".gradient-overlay, .gradient-overlay-2"
  );
  gradientOverlays.forEach((overlay) => {
    overlay.style.transition = "opacity 500ms ease";
    overlay.style.opacity = "0";
  });

  // Call the animateSeaDown function
  if (window.animateSeaDown) {
    window.animateSeaDown();
  }

  // Add star field to the scene
  if (starField && scene) {
    scene.add(starField);
  }

  // Set flag to show waitlist form
  setTimeout(() => {
    showWaitlistForm.value = true;
  }, 2000); // Delay of 2 seconds before showing the form
}
</script>

<style scoped>
.logo-star {
  margin-left: 60px !important;
  margin-bottom: -155px;
}

.page-container {
  cursor: v-bind(cursorStyle);
}

.canvas-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
}

.text-overlay {
  position: absolute;
  top: 38%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 32px;
  font-weight: bold;
  color: black;
  z-index: -2;
  opacity: 0;
  animation: fadeIn 500ms ease-out;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.gradient-overlay {
  position: fixed;
  bottom: 0px;
  left: 0;
  width: 100%;
  height: 300px;
  background: linear-gradient(to top, #f5f4ee 50%, #f5f4ee00);
  z-index: -4;
  pointer-events: none;
}

.gradient-overlay-2 {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 160px;
  background: linear-gradient(
    to top,
    hsl(193, 58%, 9%) 40%,
    rgba(246, 220, 189, 0)
  );
  z-index: -3;
  pointer-events: none;
}

.text-container {
  color: #050505;
  overflow-y: auto;
  margin-top: 12vh;
  margin-bottom: 10vh;
  width: 100vw;
  min-height: 100lvh;
  position: relative;
  z-index: 0;
}

.text-container::before {
  content: "";
  height: 100%;
  width: 100px;
  border-left: 1px solid #ceccc5;
  position: absolute;
  top: 0;
  left: 50%;
  z-index: -1;
}

.text-section {
  margin-bottom: 40vh;
  width: min(400px, 90vw);
  margin-left: auto;
  margin-right: auto;
  background: #f5f4ee;
  padding: 24px 0;
  user-select: none;
}

.text-section img {
  width: 100%;
  height: auto;
  max-width: min(300px, 90vw);
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.text-section h2 {
  text-wrap: pretty;
  line-height: 1.3;
  font-size: 1.8em;
}

.text-section p {
  line-height: 1.3;
}

.buy-now-button {
  background-color: #007aff;
  color: #fff;
  border: none;
  padding: 12px 16px;
  width: min(300px, 90vw);
  border-radius: 36px;
  cursor: pointer;
  margin-top: 24px;
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

.buy-now-button:hover {
  background-color: #176bc5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
