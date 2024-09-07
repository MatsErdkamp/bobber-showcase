import * as THREE from "three";
import { ShaderMaterial, BackSide, AdditiveBlending } from "three";

export function createStarMaterial() {
  return new ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      resolution: {
        value: new THREE.Vector2(
          Math.max(window.innerWidth, window.innerHeight),
          Math.max(window.innerWidth, window.innerHeight)
        ),
      },
      aspect: { value: window.innerWidth / window.innerHeight },
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
      uniform float aspect;
      varying vec2 vUv;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        vec2 uv = vUv;
        uv.x *= aspect;
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
    blending: AdditiveBlending,
  });
}
