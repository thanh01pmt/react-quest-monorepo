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
      uColor: { value: new THREE.Color('#FFFF00') },
      uHeight: { value: TILE_SIZE }
    },
    vertexShader: `
      varying float vY;
      void main() {
        vY = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uHeight;
      varying float vY;
      void main() {
        // Calculate normalized Y from 0 (bottom) to 1 (top)
        float normalizedY = (vY + uHeight / 2.0) / uHeight;
        float opacity = (1.0 - normalizedY) * 0.5; 
        gl_FragColor = vec4(uColor, opacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  }), []);

  const centerPos: [number, number, number] = [position[0], position[1] + TILE_SIZE / 2, position[2]];
  const sideLength = TILE_SIZE * 0.8;

  return (
    <mesh position={centerPos}>
      <boxGeometry args={[sideLength, TILE_SIZE, sideLength]} />
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