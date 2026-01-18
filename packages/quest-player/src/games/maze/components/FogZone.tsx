import React, { useMemo } from 'react';
import { Cloud, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { FogZone as FogZoneType } from '../../../types';

interface FogZoneProps {
    config: FogZoneType;
}

const TILE_SIZE = 2;

export const FogZone: React.FC<FogZoneProps> = ({ config }) => {
    const { position, scale, color, density = 0.5, noiseSpeed = 0.1, opacity = 0.5 } = config;

    // Convert logical coordinates to world coordinates
    // Position in config is typically tile-based (integers)
    const worldPos = useMemo(() => new THREE.Vector3(
        position.x * TILE_SIZE,
        position.y * TILE_SIZE,
        position.z * TILE_SIZE
    ), [position]);

    const worldScale = useMemo(() => new THREE.Vector3(
        scale.x * TILE_SIZE,
        scale.y * TILE_SIZE,
        scale.z * TILE_SIZE
    ), [scale]);

    // Cloud component from drei creates "puffs" of cloud distributed in a volume.
    // We'll try to match the scale.
    // drei Cloud args: width, depth, height (bounds)
    // But Cloud signature is: width?: number; depth?: number; segments?: number; texture?: string; color?: ColorRepresentation; ...
    // It handles "bounds" via width (x) and depth (z). Height is somewhat handled by segments/volume.
    // Actually, let's use a group and scale it.

    return (
        <group position={worldPos}>
            {/* Visual helper for editing (optional, maybe in builder only) */}
            {/* <mesh visible={false}>
         <boxGeometry args={[worldScale.x, worldScale.y, worldScale.z]} />
         <meshBasicMaterial wireframe color="red" />
       </mesh> */}

            <Cloud
                position={[0, 0, 0]}
                opacity={opacity}
                speed={noiseSpeed} // Animation speed
                bounds={[worldScale.x, worldScale.y, worldScale.z]} // Spread bounds
                segments={Math.floor(density * 20) + 10} // Partiles count
                color={color}
            />

            {/* Add sparkles for magical feel if density is high */}
            {density > 0.7 && (
                <Sparkles
                    color={color}
                    count={20}
                    scale={[worldScale.x, worldScale.y, worldScale.z]}
                    size={6}
                    speed={0.4}
                    opacity={0.5}
                />
            )}
        </group>
    );
};
