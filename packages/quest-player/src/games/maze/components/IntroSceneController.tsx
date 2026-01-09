// src/games/maze/components/IntroSceneController.tsx

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { IntroSceneConfig, Block } from '../../../types';

// Constants
const DEFAULT_DURATION = 4000;
const DEFAULT_DISTANCE = 20;
const DEFAULT_HEIGHT = 15;
const DEFAULT_RADIUS = 25;
const DEFAULT_RADIUS_X = 30;
const DEFAULT_RADIUS_Z = 20;
const DEFAULT_LOOPS = 1;
const TILE_SIZE = 2;

interface IntroSceneControllerProps {
    config: IntroSceneConfig;
    blocks: Block[];
    onComplete: () => void;
}

/**
 * Tính toán tâm màn chơi từ bounding box của tất cả blocks
 */
const calculateMapCenter = (blocks: Block[]): THREE.Vector3 => {
    if (!blocks || blocks.length === 0) {
        return new THREE.Vector3(0, 0, 0);
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const block of blocks) {
        minX = Math.min(minX, block.position.x);
        maxX = Math.max(maxX, block.position.x);
        minY = Math.min(minY, block.position.y);
        maxY = Math.max(maxY, block.position.y);
        minZ = Math.min(minZ, block.position.z);
        maxZ = Math.max(maxZ, block.position.z);
    }

    return new THREE.Vector3(
        ((minX + maxX) / 2) * TILE_SIZE,
        ((minY + maxY) / 2) * TILE_SIZE,
        ((minZ + maxZ) / 2) * TILE_SIZE
    );
};

/**
 * Tính toán bán kính mặc định dựa trên kích thước map
 */
const calculateDefaultRadius = (blocks: Block[]): number => {
    if (!blocks || blocks.length === 0) return DEFAULT_RADIUS;

    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const block of blocks) {
        minX = Math.min(minX, block.position.x);
        maxX = Math.max(maxX, block.position.x);
        minZ = Math.min(minZ, block.position.z);
        maxZ = Math.max(maxZ, block.position.z);
    }

    const width = (maxX - minX) * TILE_SIZE;
    const depth = (maxZ - minZ) * TILE_SIZE;
    return Math.max(width, depth) * 0.8;
};

// --- Trajectory Functions ---

type TrajectoryFn = (
    t: number,
    config: IntroSceneConfig,
    mapCenter: THREE.Vector3,
    initialPos: THREE.Vector3,
    defaultRadius: number
) => THREE.Vector3;

/**
 * Dronie: Camera bay lùi ra xa, giữ tâm ở trung tâm
 */
const dronieTrajectory: TrajectoryFn = (t, config, mapCenter, _initialPos) => {
    const distance = config.distance ?? DEFAULT_DISTANCE;

    // Bắt đầu gần, bay lùi ra xa
    const startZ = mapCenter.z - distance * 0.3;
    const endZ = mapCenter.z + distance;

    const easeT = easeInOutCubic(t);

    return new THREE.Vector3(
        mapCenter.x,
        mapCenter.y + 10 + easeT * 5,
        startZ + (endZ - startZ) * easeT
    );
};

/**
 * Rocket: Camera bay lên cao và hướng xuống
 */
const rocketTrajectory: TrajectoryFn = (t, config, mapCenter) => {
    const height = config.height ?? DEFAULT_HEIGHT;

    const easeT = easeInOutCubic(t);

    return new THREE.Vector3(
        mapCenter.x,
        mapCenter.y + 5 + height * easeT,
        mapCenter.z + 15 - easeT * 5
    );
};

/**
 * Circle: Camera bay vòng quanh tâm
 */
const circleTrajectory: TrajectoryFn = (t, config, mapCenter, _, defaultRadius) => {
    const radius = config.radius ?? defaultRadius;
    const loops = config.loops ?? DEFAULT_LOOPS;

    const angle = t * Math.PI * 2 * loops;

    return new THREE.Vector3(
        mapCenter.x + radius * Math.cos(angle),
        mapCenter.y + 12,
        mapCenter.z + radius * Math.sin(angle)
    );
};

/**
 * Helix: Camera bay xoắn ốc quanh tâm
 */
const helixTrajectory: TrajectoryFn = (t, config, mapCenter, _, defaultRadius) => {
    const radius = config.radius ?? defaultRadius;
    const height = config.height ?? DEFAULT_HEIGHT;
    const loops = config.loops ?? DEFAULT_LOOPS;

    const angle = t * Math.PI * 2 * loops;

    return new THREE.Vector3(
        mapCenter.x + radius * Math.cos(angle),
        mapCenter.y + 5 + height * t,
        mapCenter.z + radius * Math.sin(angle)
    );
};

/**
 * Boomerang: Camera bay theo quỹ đạo oval, lên cao rồi xuống thấp
 */
const boomerangTrajectory: TrajectoryFn = (t, config, mapCenter) => {
    const radiusX = config.radiusX ?? DEFAULT_RADIUS_X;
    const radiusZ = config.radiusZ ?? DEFAULT_RADIUS_Z;
    const height = config.height ?? DEFAULT_HEIGHT;

    // Bay 1 vòng ellipse
    const angle = t * Math.PI * 2;

    // Độ cao lên xuống theo sin
    const heightOffset = Math.sin(Math.PI * t) * height;

    return new THREE.Vector3(
        mapCenter.x + radiusX * Math.cos(angle),
        mapCenter.y + 8 + heightOffset,
        mapCenter.z + radiusZ * Math.sin(angle)
    );
};

// Easing function
const easeInOutCubic = (t: number): number => {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Map trajectory functions
const trajectoryMap: Record<string, TrajectoryFn> = {
    dronie: dronieTrajectory,
    rocket: rocketTrajectory,
    circle: circleTrajectory,
    helix: helixTrajectory,
    boomerang: boomerangTrajectory,
};

/**
 * IntroSceneController - Điều khiển camera animation cho intro scene
 */
export const IntroSceneController: React.FC<IntroSceneControllerProps> = ({
    config,
    blocks,
    onComplete,
}) => {
    const { camera } = useThree();
    const elapsedRef = useRef(0);
    const completedRef = useRef(false);

    const duration = config.duration ?? DEFAULT_DURATION;
    const trajectoryFn = trajectoryMap[config.type] ?? circleTrajectory;

    // Tính toán tâm màn chơi và bán kính mặc định
    const mapCenter = useMemo(() => calculateMapCenter(blocks), [blocks]);
    const defaultRadius = useMemo(() => calculateDefaultRadius(blocks), [blocks]);

    // Lưu vị trí ban đầu của camera
    const initialPos = useMemo(() => camera.position.clone(), [camera]);

    // Reset khi component mount
    useEffect(() => {
        elapsedRef.current = 0;
        completedRef.current = false;

        // Đặt camera ở vị trí bắt đầu
        const startPos = trajectoryFn(0, config, mapCenter, initialPos, defaultRadius);
        camera.position.copy(startPos);
        camera.lookAt(mapCenter);
    }, [config, mapCenter, initialPos, defaultRadius, trajectoryFn, camera]);

    // Animation loop
    useFrame((_, delta) => {
        if (completedRef.current) return;

        elapsedRef.current += delta * 1000; // Convert to ms
        const t = Math.min(elapsedRef.current / duration, 1);

        // Tính toán vị trí camera
        const newPos = trajectoryFn(t, config, mapCenter, initialPos, defaultRadius);
        camera.position.copy(newPos);
        camera.lookAt(mapCenter);

        // Kiểm tra hoàn thành
        if (t >= 1 && !completedRef.current) {
            completedRef.current = true;
            onComplete();
        }
    });

    return null; // Component này không render gì, chỉ điều khiển camera
};
