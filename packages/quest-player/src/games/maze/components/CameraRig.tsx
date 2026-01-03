// src/games/maze/components/CameraRig.tsx

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { gsap } from 'gsap';
import type { CameraMode } from '../../../types';

const FOLLOW_LERP_FACTOR = 0.08;
const TRANSITION_DURATION = 0.75;
const INTRO_TRANSITION_DURATION = 0.8; // Thời gian chuyển từ intro về follow

interface CameraRigProps {
  targetRef: React.RefObject<THREE.Group>;
  mode: CameraMode;
  /** Nếu true, CameraRig sẽ không điều khiển camera (intro scene đang chạy) */
  introMode?: boolean;
  /** Callback khi intro transition hoàn tất */
  onIntroTransitionComplete?: () => void;
}

export const CameraRig: React.FC<CameraRigProps> = ({
  targetRef,
  mode,
  introMode = false,
  onIntroTransitionComplete
}) => {
  const { camera } = useThree();
  const orbitControlsRef = useRef<any>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // FIX: Use useRef instead of useState to avoid stale closure in useFrame
  const isTransitioningFromIntroRef = useRef(false);
  const transitionProgressRef = useRef(0);
  const introEndPosRef = useRef<THREE.Vector3 | null>(null);
  const prevIntroModeRef = useRef<boolean>(introMode);

  // Effect để xử lý khi intro mode kết thúc
  useEffect(() => {
    console.log('[DEBUG CameraRig] introMode changed:', prevIntroModeRef.current, '->', introMode);

    // Chỉ trigger transition khi introMode chuyển từ true -> false
    if (prevIntroModeRef.current === true && introMode === false) {
      console.log('[DEBUG CameraRig] Intro ended! Starting smooth transition');
      // Lưu vị trí camera khi intro vừa kết thúc
      introEndPosRef.current = camera.position.clone();
      console.log('[DEBUG CameraRig] Saved intro end position:', introEndPosRef.current);
      isTransitioningFromIntroRef.current = true;
      transitionProgressRef.current = 0;
    } else if (introMode === true) {
      // Reset khi vào intro mode
      introEndPosRef.current = null;
      isTransitioningFromIntroRef.current = false;
    }

    prevIntroModeRef.current = introMode;
  }, [introMode, camera]);

  // useEffect để cấu hình controls khi mode thay đổi
  useEffect(() => {
    const controls = orbitControlsRef.current;
    if (!controls) return;

    // Không điều chỉnh controls khi đang ở intro mode
    if (introMode) {
      controls.enabled = false;
      return;
    }

    // Hủy các tween cũ để tránh xung đột
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    // Lấy vị trí robot để làm cơ sở cho các tween chuyển cảnh
    const robotPosition = targetRef.current?.position || new THREE.Vector3(0, 0, 0);
    const lookAtTarget = new THREE.Vector3(robotPosition.x, robotPosition.y, robotPosition.z);

    switch (mode) {
      case 'Follow':
        controls.enabled = false;
        break;

      case 'TopDown':
        controls.enabled = true;
        controls.enablePan = true;
        controls.enableRotate = false;
        controls.enableZoom = true;

        // Tween camera đến vị trí nhìn từ trên xuống
        gsap.to(camera.position, {
          duration: TRANSITION_DURATION,
          x: robotPosition.x,
          y: robotPosition.y + 26,
          z: robotPosition.z + 0.01,
          ease: 'power2.inOut',
        });
        // Tween target của controls để nhìn vào robot
        gsap.to(controls.target, {
          duration: TRANSITION_DURATION,
          ...lookAtTarget,
          ease: 'power2.inOut',
        });
        break;

      case 'Free':
        controls.enabled = true;
        controls.enablePan = true;
        controls.enableRotate = true;
        controls.enableZoom = true;
        break;
    }
  }, [mode, targetRef, camera, introMode]);

  // useEffect để theo dõi sự tương tác của người dùng
  useEffect(() => {
    const controls = orbitControlsRef.current;
    if (!controls) return;

    const onStart = () => setIsInteracting(true);
    const onEnd = () => setIsInteracting(false);

    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);

    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, []);

  // useFrame để cập nhật camera mỗi frame
  useFrame((_, delta) => {
    const controls = orbitControlsRef.current;
    if (!controls || !targetRef.current) return;

    // Không điều khiển camera khi đang ở intro mode
    if (introMode) return;

    const robotPosition = targetRef.current.position;
    const lookAtTarget = robotPosition.clone();

    // Debug: Log condition values every 60 frames (approx 1 per second)
    if (Math.random() < 0.017) {
      console.log('[DEBUG CameraRig useFrame] Checking conditions:', {
        isTransitioning: isTransitioningFromIntroRef.current,
        hasEndPos: !!introEndPosRef.current,
        mode: mode,
        introMode: introMode
      });
    }

    // Xử lý smooth transition từ intro về follow
    // FIX: Transition runs regardless of mode, not just Follow mode
    if (isTransitioningFromIntroRef.current && introEndPosRef.current) {
      transitionProgressRef.current += delta / INTRO_TRANSITION_DURATION;
      const t = Math.min(transitionProgressRef.current, 1);
      const easeT = easeOutCubic(t);

      // Debug log transition progress (only log every 10 frames to avoid spam)
      if (Math.floor(t * 100) % 10 === 0) {
        console.log('[DEBUG CameraRig] Transition progress:', t.toFixed(2), 'easeT:', easeT.toFixed(2));
      }

      // Camera thấp hơn và xa hơn nhân vật
      const robotQuaternion = targetRef.current.quaternion;
      const distanceFactor = 0.7;
      const offset = new THREE.Vector3(0, 18 * distanceFactor, -18 * distanceFactor);
      offset.applyQuaternion(robotQuaternion);
      const followTargetPos = robotPosition.clone().add(offset);

      // Lerp từ vị trí cuối intro về vị trí follow
      camera.position.lerpVectors(introEndPosRef.current, followTargetPos, easeT);
      controls.target.lerp(lookAtTarget, easeT);

      if (t >= 1) {
        console.log('[DEBUG CameraRig] Transition complete! Camera at:', camera.position);
        isTransitioningFromIntroRef.current = false;
        introEndPosRef.current = null;
        onIntroTransitionComplete?.();
      }

      controls.update();
      return;
    }

    if (mode === 'Follow') {
      const robotQuaternion = targetRef.current.quaternion;

      // Camera thấp hơn và xa hơn nhân vật
      const distanceFactor = 0.7;
      const offset = new THREE.Vector3(0, 18 * distanceFactor, -18 * distanceFactor);
      offset.applyQuaternion(robotQuaternion);
      const cameraTargetPosition = robotPosition.clone().add(offset);

      // Cập nhật cả vị trí camera và điểm nhìn
      camera.position.lerp(cameraTargetPosition, FOLLOW_LERP_FACTOR);
      controls.target.lerp(lookAtTarget, FOLLOW_LERP_FACTOR);

    } else if (mode === 'TopDown' && !isInteracting) {
      // Ở chế độ TopDown, chỉ di chuyển điểm nhìn theo robot
      controls.target.lerp(lookAtTarget, FOLLOW_LERP_FACTOR);
    }

    // Luôn gọi update() để OrbitControls áp dụng các thay đổi
    controls.update();
  });

  return (
    <OrbitControls
      ref={orbitControlsRef}
      enableDamping={true}
      dampingFactor={0.05}
      screenSpacePanning={false}
      minDistance={2}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  );
};

// Easing function
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};