<template>
  <div class="page-container">
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
          <h2>More explanation</h2>
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
import { onMounted, ref, onUnmounted, watch } from "vue";
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

const sceneContainer = ref(null);
const textElement = ref(null);
const isBobberPastMiddle = ref(false);
const isAnimating = ref(false);
const isRocketLaunched = ref(false);
const showWaitlistForm = ref(false);
let seaMaterial = null;
let bobber = null; // Declare bobber in a wider scope
let scene;
let starField;
let starMaterial;

onMounted(() => {
  const container = sceneContainer.value;

  // Create a new scene
  scene = new THREE.Scene();

  // Create a perspective camera
  const camera = new THREE.PerspectiveCamera(
    20, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near plane
    1000 // Far plane
  );
  camera.position.z = 10;

  // Create a WebGL renderer with alpha enabled (for transparency)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // Set clear color to black but fully transparent
  container.appendChild(renderer.domElement); // Append canvas to the container

  // Load the bobber.glb model
  const loader = new GLTFLoader();
  let bobberMaterials;
  loader.load(
    bobberModel,
    (gltf) => {
      bobber = gltf.scene; // Assign to the global bobber variable
      bobber.position.y = 4;
      bobber.scale.set(20, 20, 20);

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
      seaMaterial = new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color(0x6799aa) },
          color2: { value: new THREE.Color(0x4a7a8c) },
          foamColor: { value: new THREE.Color(0xeeeeff) },
          envMap: { value: environmentMap },
          seaPosition: { value: new THREE.Vector3(0, 0, 0) },
        },
        vertexShader: `
          uniform float time;
          uniform vec3 seaPosition;
          varying vec2 vUv;
          varying float vElevation;
          varying vec3 vWorldPosition;
          varying vec3 vNormal;

          // Simplex 2D noise
          vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
              dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 40.0 * dot(m, g);
          }

          void main() {
            vUv = uv;
            vec3 pos = position + seaPosition;

            float noiseScale = 0.2;
            float noiseTime = time * 0.4;

            float noise1 = snoise(vec2(vUv.x * 2.0 + noiseTime, vUv.y * 2.0 + noiseTime)) * noiseScale;
            float noise2 = snoise(vec2(vUv.x * 4.0 - noiseTime, vUv.y * 4.0 - noiseTime)) * noiseScale * 0.5;
            float noise3 = snoise(vec2(vUv.x * 8.0 + noiseTime * 1.5, vUv.y * 8.0 - noiseTime * 1.5)) * noiseScale * 0.25;
            float noise4 = snoise(vec2(vUv.x * 16.0 + noiseTime * 2.0, vUv.y * 16.0 - noiseTime * 2.0)) * noiseScale * 0.1;

            vElevation = noise1 + noise2 + noise3 + noise4;
            pos.z += vElevation;

            vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
            vWorldPosition = worldPosition.xyz;
            vNormal = normalize(mat3(modelMatrix) * normal);

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 foamColor;
          uniform float time;
          uniform samplerCube envMap;
          // cameraPosition is already provided by Three.js, so we don't need to declare it
          varying vec2 vUv;
          varying float vElevation;
          varying vec3 vWorldPosition;
          varying vec3 vNormal;

          // Simplex 2D noise function (same as in vertex shader)
          vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
              dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 40.0 * dot(m, g);
          }

          void main() {
            float mixStrength = (sin(vUv.x * 10.0 + time) + sin(vUv.y * 10.0 + time)) * 0.5 + 0.5;
            vec3 mixedColor = mix(color1, color2, mixStrength);

            float foamEdge = smoothstep(0.04, 0.1, vElevation);
            vec3 finalColor = mix(mixedColor, foamColor, foamEdge);

            // Calculate reflection with displacement
            vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
            vec3 reflectionDirection = reflect(-viewDirection, vNormal);

            // Add displacement to reflection direction
            float displacementScale = 0.1;
            float displacementX = snoise(vUv * 10.0 + time * 0.5) * displacementScale;
            float displacementY = snoise((vUv + 0.5) * 10.0 + time * 0.5) * displacementScale;
            reflectionDirection.x += displacementX;
            reflectionDirection.y += displacementY;
            reflectionDirection = normalize(reflectionDirection);

            vec3 reflection = textureCube(envMap, reflectionDirection).rgb;

            // Mix reflection with water color
            float reflectionStrength = 0.4; // Adjust this value to control reflection intensity
            finalColor = mix(finalColor, reflection, reflectionStrength);

            float alpha = 0.8 + foamEdge * 0.2;
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
      });
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
      starMaterial = new ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          resolution: {
            value: new THREE.Vector2(
              Math.max(window.innerWidth, window.innerHeight),
              Math.max(window.innerWidth, window.innerHeight)
            ),
          },
          aspect: { value: window.innerWidth / window.innerHeight }, // Add aspect ratio uniform
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec2 resolution;
          uniform float aspect; // Add aspect ratio uniform
          varying vec2 vUv;

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          void main() {
            vec2 uv = vUv;
            uv.x *= aspect; // Adjust x coordinate based on aspect ratio
            vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
            
            float gridSize = 4.0;
            vec2 gridUv = fract(uv * resolution / gridSize) - 0.5;
            vec2 id = floor(uv * resolution / gridSize);
            
            vec2 offset = vec2(
              hash(id + 0.1) - 0.5,
              hash(id + 0.2) - 0.5
            ) * 0.7;
            
            gridUv += offset;
            
            float size = hash(id) * 0.002 + 0.03;
            float brightness = pow(hash(id + 0.3), 5.0) * 0.8 + 0.4;
            
            float star = length(gridUv) - size;
            star = 1.0 - step(0.0, star);
            
            float twinkle = sin(time * (hash(id + 0.4) * 2.0 + 1.0) + hash(id + 0.5) * 6.28) * 0.5 + 0.5;
            brightness *= mix(0.5, 1.0, twinkle);
            
            color.rgb = vec3(1.0, 0.9, 0.8) * star * brightness;
            color.a = star * brightness;

            gl_FragColor = color;
          }
        `,
        side: BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      // Create a large sphere for the star field
      const starGeometry = new SphereGeometry(50, 64, 64);
      starField = new Mesh(starGeometry, starMaterial);
      // Don't add to scene yet, we'll do that when the rocket launches

      // Function to check if bobber is in the middle of the canvas
      const isBobberPastMiddleOfCanvas = () => {
        if (!bobber || isAnimating.value) return false;
        // Get the bobber's position in screen coordinates
        const bobberScreenPosition = bobber.position.clone().project(camera);

        // Convert to normalized device coordinates (NDC)
        const ndcX = bobberScreenPosition.x;
        const ndcY = bobberScreenPosition.y;

        // Check if the bobber is past the middle of the screen
        // NDC coordinates range from -1 to 1, where 0 is the center
        // We check if the bobber's y position is less than 0 (below the center)
        return ndcY < -0.2;
      };

      // Separate function for subtle rotation
      const applySubtleRotation = () => {
        if (!bobber) return;

        bobber.rotation.x = Math.sin(seaMaterial.uniforms.time.value) * 0.051;
        bobber.rotation.y = Math.sin(seaMaterial.uniforms.time.value) * 0.044;
        bobber.rotation.z = Math.cos(seaMaterial.uniforms.time.value) * 0.046;

        // Add subtle horizontal movement
        bobber.position.x +=
          Math.sin(seaMaterial.uniforms.time.value * 0.5) * 0.0009;
        bobber.position.z +=
          Math.cos(seaMaterial.uniforms.time.value * 0.48) * 0.001;
      };

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
          // Apply gravity and floating after 2 seconds
          if (seaMaterial.uniforms.time.value > 1) {
            applyGravity();
          }
        }
        applySubtleRotation();

        // Update water shader time
        seaMaterial.uniforms.time.value += 0.01;

        // Update star shader time
        if (starMaterial) {
          starMaterial.uniforms.time.value += 0.016; // Assuming 60 FPS
        }

        isBobberPastMiddle.value = isBobberPastMiddleOfCanvas();

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

      animate();
    },
    undefined,
    (error) => {
      console.error("An error happened while loading the model:", error);
    }
  );

  // Update canvas size on window resize
  const onWindowResize = () => {
    // Check if it's a real resize or just the mobile viewport changing

    camera.aspect = window.innerWidth / initialInnerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, initialInnerHeight);

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
  });
});

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

function updateCanvasSize() {
  if (sceneContainer.value) {
    sceneContainer.value.style.height = `${window.innerHeight}px`;
  }
}

window.addEventListener("resize", updateCanvasSize);
updateCanvasSize(); // Initial call to set the correct size

onUnmounted(() => {
  window.removeEventListener("resize", updateCanvasSize);
});
</script>

<style scoped>
.logo-star {
  margin-left: 60px !important;
  margin-bottom: -155px;
}

.canvas-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
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
