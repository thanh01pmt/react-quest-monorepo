// src/games/maze/components/Portal.tsx

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { GameAssets } from '../config/gameAssets';

type PortalColor = 'blue' | 'green' | 'orange' | 'pink';

interface PortalProps {
  position: [number, number, number];
  color: PortalColor;
  isActive?: boolean;
}

const TILE_SIZE = 2;
const ASSET_SCALE = TILE_SIZE * 0.74;

const COLOR_MAP: Record<PortalColor, THREE.Color> = {
  blue: new THREE.Color('#00bfff'),
  green: new THREE.Color('#32cd32'),
  orange: new THREE.Color('#ff8c00'),
  pink: new THREE.Color('#ff69b4'),
};

export const Portal: React.FC<PortalProps> = ({ position, color, isActive = true }) => {
  const ref = useRef<THREE.Group>(null!);
  const assetPath = GameAssets.world.misc.portal;

  const { scene } = useGLTF(assetPath, true);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  const emissiveMaterial = useRef<THREE.MeshStandardMaterial | null>(null);

  // Find and prepare materials
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Assuming the portal model has two materials: one for the frame, one for the emissive core
        if (child.material.name === 'Portal_Core') {
          // Clone the material so we can modify it without affecting other instances
          emissiveMaterial.current = child.material.clone() as THREE.MeshStandardMaterial;
          child.material = emissiveMaterial.current;
        }
      }
    });
  }, [clonedScene]); // Removed color dependency as we handle it in useFrame

  // Animate the portal
  useFrame((state) => {
    if (ref.current && emissiveMaterial.current) {
      const time = state.clock.getElapsedTime();

      if (isActive) {
        // Active: Rotate fast, pulse, correct color
        ref.current.rotation.y += 0.02;
        emissiveMaterial.current.emissive.set(COLOR_MAP[color]);
        emissiveMaterial.current.emissiveIntensity = 1.0 + Math.sin(time * 3) * 0.5;
        emissiveMaterial.current.opacity = 0.9;
        emissiveMaterial.current.transparent = true;
      } else {
        // Inactive: No rotation, dim, grey
        emissiveMaterial.current.emissive.setHex(0x555555);
        emissiveMaterial.current.emissiveIntensity = 0.1;
        emissiveMaterial.current.opacity = 0.3;
        emissiveMaterial.current.transparent = true;
      }
    }
  });

  return (
    <primitive
      ref={ref}
      object={clonedScene}
      position={position}
      scale={ASSET_SCALE}
    />
  );
};

useGLTF.preload(GameAssets.world.misc.portal);