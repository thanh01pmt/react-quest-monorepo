// src/games/maze/components/Switch.tsx

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { GameAssets } from '../config/gameAssets';

interface SwitchProps {
  position: [number, number, number];
  isOn: boolean;
}

const TILE_SIZE = 2;
const ASSET_SCALE = TILE_SIZE * 0.85;

const ON_COLOR = new THREE.Color('#39FF14'); // Neon green
const OFF_COLOR = new THREE.Color('#888888'); // Grey

const GlowBeam: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const shaderArgs = useMemo(() => ({
    uniforms: {
      uColor: { value: new THREE.Color('#FFFF00') }, // Yellow
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        // Gradient from bottom (y=0) to top (y=1)
        // Fade out as we go up
        float opacity = (1.0 - vUv.y) * 0.5; 
        gl_FragColor = vec4(uColor, opacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  }), []);

  // Position: Center of cylinder should be at position.y + height/2
  // Height = TILE_SIZE / 2 (1 block)? User said "up to 1 block". 
  // TILE_SIZE is 2. So 1 block height = 2 units?
  // Maze blocks are TILE_SIZE.
  // "up to 1 block" = TILE_SIZE height.
  // Base at position[1]. Center at position[1] + TILE_SIZE/2.
  const centerPos: [number, number, number] = [position[0], position[1] + TILE_SIZE / 2, position[2]];

  return (
    <mesh position={centerPos}>
      <cylinderGeometry args={[0.4, 0.4, TILE_SIZE, 16, 1, true]} />
      <shaderMaterial args={[shaderArgs]} />
    </mesh>
  );
};

export const SwitchComponent: React.FC<SwitchProps> = ({ position, isOn }) => {
  const ref = useRef<THREE.Group>(null!);
  const assetPath = GameAssets.world.misc.switch;

  const { scene } = useGLTF(assetPath, true);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  const material = useRef<THREE.MeshStandardMaterial | null>(null);

  // Find and prepare the material once
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Clone the material to avoid interfering with other instances
        const originalMaterial = child.material as THREE.MeshStandardMaterial;
        material.current = originalMaterial.clone();
        child.material = material.current;
      }
    });
  }, [clonedScene]);

  // Animate the switch
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime();
      // Constant rotation
      // ref.current.rotation.y = time * 0.5;
      // Bobbing animation
      //   ref.current.position.y = position[1] + 0.25 + Math.sin(time * 1.5) * 0.1;
      ref.current.position.y = position[1] - 0.1;
    }
  });

  // Update material properties based on the isOn state
  useFrame(() => {
    if (material.current) {
      const targetColor = isOn ? ON_COLOR : OFF_COLOR;
      const targetIntensity = isOn ? 1.5 : 0.2;

      // Smoothly transition color and intensity
      material.current.color.lerp(targetColor, 0.1);
      material.current.emissive.lerp(targetColor, 0.1);
      material.current.emissiveIntensity = THREE.MathUtils.lerp(material.current.emissiveIntensity, targetIntensity, 0.1);
    }
  });


  return (
    <group>
      <primitive
        ref={ref}
        object={clonedScene}
        position={position}
        scale={ASSET_SCALE}
      />
      {isOn && <GlowBeam position={position} />}
    </group>
  );
};

// Preload the asset for better performance
useGLTF.preload(GameAssets.world.misc.switch);