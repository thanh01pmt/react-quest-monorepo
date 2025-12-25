/**
 * RotateGizmo Component
 * 
 * A 3D rotation gizmo that allows users to rotate objects around Y axis.
 * Features:
 * - Circular ring indicator
 * - Drag to rotate
 * - Snap to angle options (Free, 45°, 90°)
 * - Visual angle indicator
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Ring, Line } from '@react-three/drei';

// Types
export type SnapAngle = 'free' | 45 | 90;

interface RotateGizmoProps {
    /** World position of the gizmo center */
    position: [number, number, number];
    /** Called when user starts rotating */
    onRotateStart?: () => void;
    /** Called during rotation with angle in radians */
    onRotate?: (angleRadians: number) => void;
    /** Called when rotation ends */
    onRotateEnd?: () => void;
    /** Snap angle setting */
    snapAngle?: SnapAngle;
    /** Scale of the gizmo */
    scale?: number;
    /** Whether gizmo is visible */
    visible?: boolean;
    /** Current rotation angle (for display) */
    currentAngle?: number;
}

// Constants
const RING_RADIUS = 1.2;
const RING_THICKNESS = 0.08;
const RING_COLOR = '#ffaa00';
const RING_HOVER_COLOR = '#ffcc44';
const INDICATOR_COLOR = '#ffffff';

/**
 * Snap angle to nearest increment
 */
function snapToAngle(angle: number, snapAngle: SnapAngle): number {
    if (snapAngle === 'free') return angle;
    const snapRadians = (snapAngle * Math.PI) / 180;
    return Math.round(angle / snapRadians) * snapRadians;
}

/**
 * Main RotateGizmo component
 */
export function RotateGizmo({
    position,
    onRotateStart,
    onRotate,
    onRotateEnd,
    snapAngle = 90,
    scale = 1,
    visible = true,
    currentAngle = 0,
}: RotateGizmoProps) {
    const { camera } = useThree();
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartAngleRef = useRef<number>(0);
    const initialMouseAngleRef = useRef<number>(0);

    // Calculate mouse angle relative to gizmo center
    const getMouseAngle = (e: ThreeEvent<PointerEvent>): number => {
        // Project gizmo center to screen
        const gizmoCenter = new THREE.Vector3(...position);
        const screenCenter = gizmoCenter.clone().project(camera);

        // Convert to pixel coordinates
        const halfWidth = window.innerWidth / 2;
        const halfHeight = window.innerHeight / 2;
        const centerX = screenCenter.x * halfWidth + halfWidth;
        const centerY = -screenCenter.y * halfHeight + halfHeight;

        // Calculate angle from center to mouse
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        return Math.atan2(dy, dx);
    };

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsDragging(true);
        dragStartAngleRef.current = currentAngle;
        initialMouseAngleRef.current = getMouseAngle(e);
        onRotateStart?.();
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging) return;

        const currentMouseAngle = getMouseAngle(e);
        const deltaAngle = currentMouseAngle - initialMouseAngleRef.current;

        // Calculate new angle
        let newAngle = dragStartAngleRef.current + deltaAngle;

        // Apply snapping
        newAngle = snapToAngle(newAngle, snapAngle);

        onRotate?.(newAngle);
    };

    const handlePointerUp = () => {
        if (isDragging) {
            setIsDragging(false);
            onRotateEnd?.();
        }
    };

    // Generate angle indicator points
    const indicatorPoints = useMemo(() => {
        const start = new THREE.Vector3(0, 0, 0);
        const end = new THREE.Vector3(
            Math.cos(currentAngle) * RING_RADIUS * 1.3,
            0,
            Math.sin(currentAngle) * RING_RADIUS * 1.3
        );
        return [start, end];
    }, [currentAngle]);

    // Generate snap markers (for 90° or 45°)
    const snapMarkers = useMemo(() => {
        if (snapAngle === 'free') return [];
        const markers: THREE.Vector3[][] = [];
        const snapCount = 360 / snapAngle;

        for (let i = 0; i < snapCount; i++) {
            const angle = (i * snapAngle * Math.PI) / 180;
            const inner = new THREE.Vector3(
                Math.cos(angle) * RING_RADIUS * 0.9,
                0,
                Math.sin(angle) * RING_RADIUS * 0.9
            );
            const outer = new THREE.Vector3(
                Math.cos(angle) * RING_RADIUS * 1.1,
                0,
                Math.sin(angle) * RING_RADIUS * 1.1
            );
            markers.push([inner, outer]);
        }
        return markers;
    }, [snapAngle]);

    if (!visible) return null;

    const ringColor = isHovered || isDragging ? RING_HOVER_COLOR : RING_COLOR;

    return (
        <group
            position={position}
            scale={scale}
            rotation={[-Math.PI / 2, 0, 0]} // Lay flat on XZ plane
        >
            {/* Main rotation ring */}
            <Ring
                args={[RING_RADIUS - RING_THICKNESS, RING_RADIUS + RING_THICKNESS, 64]}
                onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
                onPointerOut={(e) => { e.stopPropagation(); setIsHovered(false); }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <meshBasicMaterial
                    color={ringColor}
                    opacity={isDragging ? 0.9 : 0.7}
                    transparent
                    side={THREE.DoubleSide}
                />
            </Ring>

            {/* Snap markers */}
            {snapMarkers.map((points, i) => (
                <Line
                    key={i}
                    points={points}
                    color="#888888"
                    lineWidth={2}
                />
            ))}

            {/* Current angle indicator */}
            <Line
                points={indicatorPoints}
                color={INDICATOR_COLOR}
                lineWidth={3}
            />

            {/* Center dot */}
            <mesh>
                <circleGeometry args={[0.1, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Invisible larger hitbox for easier interaction */}
            <Ring
                args={[RING_RADIUS - 0.3, RING_RADIUS + 0.3, 32]}
                visible={false}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <meshBasicMaterial transparent opacity={0} />
            </Ring>
        </group>
    );
}

export default RotateGizmo;
