// src/games/maze/components/Block.tsx

import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { GameAssets } from '../config/gameAssets';

interface BlockProps {
  modelKey: string;
  position: [number, number, number];
}

const TILE_SIZE = 2;

const Block: React.FC<BlockProps> = ({ modelKey, position }) => {
  const modelKeyParts = modelKey.split('.');
  const modelCategory = modelKeyParts[0] as keyof typeof GameAssets.world;
  const modelName = modelKeyParts[1] as keyof typeof GameAssets.world[typeof modelCategory];
  // @ts-ignore
  const path = GameAssets.world[modelCategory]?.[modelName];

  if (!path) {
    console.warn(`Path not found for modelKey: ${modelKey}`);
    return null;
  }

  const { scene } = useGLTF(path, true);
  const clonedScene = useMemo(() => {
    const clone = (scene as THREE.Group).clone();
    // Properly clone materials to avoid shared material references and fix black textures
    clone.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh && child.material) {
        // Clone the material
        const clonedMaterial = child.material.clone();

        // Handle materials properly - fixes black rendering for Blender exports
        if (clonedMaterial instanceof THREE.MeshStandardMaterial) {
          // If material has a texture map, handle encoding
          if (clonedMaterial.map) {
            clonedMaterial.map = clonedMaterial.map.clone();
            clonedMaterial.map.colorSpace = THREE.SRGBColorSpace;
            clonedMaterial.map.needsUpdate = true;
          }

          // Ensure color is preserved (for solid color materials from Blender)
          // This is critical for Blender exports using Base Color without texture
          if (clonedMaterial.color) {
            clonedMaterial.color = clonedMaterial.color.clone();
          }

          // Preserve vertex colors if present
          if ((child as THREE.Mesh).geometry.attributes.color) {
            clonedMaterial.vertexColors = true;
          }

          clonedMaterial.needsUpdate = true;
        }

        child.material = clonedMaterial;
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    clonedScene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clonedScene]);

  // Special handling for tree models:
  // - Scale 0.1 (trees are 10x larger than other assets)
  // - Position offset: trees should stand on surface, not float
  const isTree = modelKey.startsWith('tree.');
  const blockScale = isTree ? TILE_SIZE * 0.1 : TILE_SIZE;
  const treePositionY = isTree ? position[1] - TILE_SIZE * 0.5 : position[1];

  return (
    <primitive
      object={clonedScene}
      position={[position[0], treePositionY, position[2]]}
      scale={blockScale}
    />
  );
};

export default React.memo(Block);