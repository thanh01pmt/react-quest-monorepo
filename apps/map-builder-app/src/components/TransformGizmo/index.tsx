/**
 * TransformGizmo Component
 * 
 * A 3D transform gizmo that allows users to move objects along X, Y, Z axes.
 * Similar to transform tools in Blender/Unity.
 * 
 * Features:
 * - 3 axis arrows (X=red, Y=green, Z=blue)
 * - Hover highlight
 * - Drag to move along axis
 * - Snap to grid option
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Cone, Line } from '@react-three/drei';

// Types
export type GizmoAxis = 'x' | 'y' | 'z' | null;

interface TransformGizmoProps {
    /** World position of the gizmo center */
    position: [number, number, number];
    /** Called when user starts dragging an axis */
    onDragStart?: (axis: GizmoAxis) => void;
    /** Called during drag with delta movement */
    onDrag?: (axis: GizmoAxis, delta: number) => void;
    /** Called when drag ends */
    onDragEnd?: () => void;
    /** Scale of the gizmo (default: 1) */
    scale?: number;
    /** Whether gizmo is visible */
    visible?: boolean;
}

// Constants
const AXIS_LENGTH = 1.5;
const ARROW_SIZE = 0.15;
const LINE_WIDTH = 3;
const HOVER_LINE_WIDTH = 5;

const AXIS_COLORS = {
    x: '#ff4444', // Red
    y: '#44ff44', // Green  
    z: '#4444ff', // Blue
};

const AXIS_HOVER_COLORS = {
    x: '#ff8888',
    y: '#88ff88',
    z: '#8888ff',
};

// Axis directions
const AXIS_DIRECTIONS: Record<string, THREE.Vector3> = {
    x: new THREE.Vector3(1, 0, 0),
    y: new THREE.Vector3(0, 1, 0),
    z: new THREE.Vector3(0, 0, 1),
};

/**
 * Individual axis arrow component
 */
function AxisArrow({
    axis,
    isHovered,
    onPointerOver,
    onPointerOut,
    onPointerDown
}: {
    axis: 'x' | 'y' | 'z';
    isHovered: boolean;
    onPointerOver: () => void;
    onPointerOut: () => void;
    onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
    const direction = AXIS_DIRECTIONS[axis];
    const color = isHovered ? AXIS_HOVER_COLORS[axis] : AXIS_COLORS[axis];
    const lineWidth = isHovered ? HOVER_LINE_WIDTH : LINE_WIDTH;

    // Calculate arrow tip position and rotation
    const tipPosition = direction.clone().multiplyScalar(AXIS_LENGTH);

    // Rotation to point cone in axis direction
    const rotation = useMemo(() => {
        if (axis === 'x') return [0, 0, -Math.PI / 2] as [number, number, number];
        if (axis === 'y') return [0, 0, 0] as [number, number, number];
        if (axis === 'z') return [Math.PI / 2, 0, 0] as [number, number, number];
        return [0, 0, 0] as [number, number, number];
    }, [axis]);

    return (
        <group
            onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); }}
            onPointerOut={(e) => { e.stopPropagation(); onPointerOut(); }}
            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e); }}
        >
            {/* Axis line */}
            <Line
                points={[[0, 0, 0], tipPosition.toArray()]}
                color={color}
                lineWidth={lineWidth}
            />

            {/* Arrow cone */}
            <group position={tipPosition.toArray()} rotation={rotation}>
                <Cone args={[ARROW_SIZE, ARROW_SIZE * 2, 8]}>
                    <meshBasicMaterial color={color} />
                </Cone>
            </group>

            {/* Invisible larger hitbox for easier selection */}
            <mesh
                position={direction.clone().multiplyScalar(AXIS_LENGTH / 2).toArray()}
                rotation={rotation}
                visible={false}
            >
                <cylinderGeometry args={[0.1, 0.1, AXIS_LENGTH, 8]} />
                <meshBasicMaterial transparent opacity={0} />
            </mesh>
        </group>
    );
}

/**
 * Main TransformGizmo component
 */
export function TransformGizmo({
    position,
    onDragStart,
    onDrag,
    onDragEnd,
    scale = 1,
    visible = true,
}: TransformGizmoProps) {
    const { camera, raycaster } = useThree();
    const [hoveredAxis, setHoveredAxis] = useState<GizmoAxis>(null);
    const [draggingAxis, setDraggingAxis] = useState<GizmoAxis>(null);
    const dragStartRef = useRef<{ mousePos: THREE.Vector2; worldPos: THREE.Vector3 } | null>(null);
    const planeRef = useRef<THREE.Plane>(new THREE.Plane());

    // Handle pointer down on axis
    const handlePointerDown = (axis: 'x' | 'y' | 'z', e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setDraggingAxis(axis);

        // Store initial mouse position
        dragStartRef.current = {
            mousePos: new THREE.Vector2(e.pointer.x, e.pointer.y),
            worldPos: new THREE.Vector3(...position),
        };

        // Create a plane perpendicular to camera but containing the axis
        const axisDir = AXIS_DIRECTIONS[axis].clone();
        const cameraDir = camera.getWorldDirection(new THREE.Vector3());

        // Plane normal is cross product of axis and camera direction
        // This gives us a plane we can drag along
        let planeNormal = new THREE.Vector3().crossVectors(axisDir, cameraDir);
        if (planeNormal.lengthSq() < 0.001) {
            // Axis is parallel to camera, use camera up instead
            planeNormal = new THREE.Vector3().crossVectors(axisDir, camera.up);
        }
        planeNormal.normalize();

        planeRef.current.setFromNormalAndCoplanarPoint(planeNormal, new THREE.Vector3(...position));

        onDragStart?.(axis);
    };

    // Handle global pointer move for dragging
    useFrame(() => {
        if (!draggingAxis || !dragStartRef.current) return;

        // Raycast to find intersection with drag plane
        const intersectPoint = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(planeRef.current, intersectPoint)) {
            // Project intersection onto axis
            const axisDir = AXIS_DIRECTIONS[draggingAxis].clone();
            const startPos = dragStartRef.current.worldPos;

            // Calculate movement along axis
            const toIntersect = intersectPoint.clone().sub(startPos);
            const delta = toIntersect.dot(axisDir);

            onDrag?.(draggingAxis, delta);
        }
    });

    // Handle pointer up
    const handlePointerUp = () => {
        if (draggingAxis) {
            setDraggingAxis(null);
            dragStartRef.current = null;
            onDragEnd?.();
        }
    };

    // Add global event listeners for drag
    // (This would need to be handled in parent component or with window events)

    if (!visible) return null;

    return (
        <group position={position} scale={scale}>
            {/* Center sphere */}
            <mesh>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* X Axis (Red) */}
            <AxisArrow
                axis="x"
                isHovered={hoveredAxis === 'x' || draggingAxis === 'x'}
                onPointerOver={() => setHoveredAxis('x')}
                onPointerOut={() => setHoveredAxis(null)}
                onPointerDown={(e) => handlePointerDown('x', e)}
            />

            {/* Y Axis (Green) */}
            <AxisArrow
                axis="y"
                isHovered={hoveredAxis === 'y' || draggingAxis === 'y'}
                onPointerOver={() => setHoveredAxis('y')}
                onPointerOut={() => setHoveredAxis(null)}
                onPointerDown={(e) => handlePointerDown('y', e)}
            />

            {/* Z Axis (Blue) */}
            <AxisArrow
                axis="z"
                isHovered={hoveredAxis === 'z' || draggingAxis === 'z'}
                onPointerOver={() => setHoveredAxis('z')}
                onPointerOut={() => setHoveredAxis(null)}
                onPointerDown={(e) => handlePointerDown('z', e)}
            />
        </group>
    );
}

export default TransformGizmo;
