import React, { useMemo } from 'react';
import { Cloud, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import type { FogZone as FogZoneType } from '../../../types';

interface FogZoneProps {
    config: FogZoneType;
}

const TILE_SIZE = 2;

// Simple hash for stable seed
const getSeed = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h);
};

export const FogZone = React.memo(({ config }: FogZoneProps) => {
    const { id, position, scale, color, density = 0.5, noiseSpeed = 0.1, opacity = 0.5 } = config;

    // Convert logical coordinates to world coordinates
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

    // Generate stable seed from ID
    const seed = useMemo(() => getSeed(id || 'fog-zone'), [id]);

    return (
        <group position={worldPos}>
            <Cloud
                seed={seed}
                position={[0, 0, 0]}
                opacity={opacity}
                speed={noiseSpeed} // Animation speed
                bounds={[worldScale.x, worldScale.y, worldScale.z]} // Spread bounds
                segments={Math.floor(density * 20) + 10} // Particles count
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
}, (prev, next) => {
    // Custom comparison to prevent re-render if config content is same
    // even if reference differs.
    return JSON.stringify(prev.config) === JSON.stringify(next.config);
});
