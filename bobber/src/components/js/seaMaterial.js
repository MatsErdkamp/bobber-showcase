import * as THREE from "three";
import { ShaderMaterial } from "three";

export function createSeaMaterial(environmentMap) {
  return new ShaderMaterial({
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
}
