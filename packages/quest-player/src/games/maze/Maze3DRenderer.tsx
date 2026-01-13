// src/games/maze/Maze3DRenderer.tsx

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Sky, Stars, Cloud, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { IGameRenderer as IGameRendererBase, MazeConfig, CameraMode } from '../../types';
import type { MazeGameState } from './types';
import { RobotCharacter } from './components/RobotCharacter';
import { CameraRig } from './components/CameraRig';
import { IntroSceneController } from './components/IntroSceneController';
import BlockComponent from './components/Block';
import { Collectible } from './components/Collectible';
import { Portal } from './components/Portal';
import { SwitchComponent } from './components/Switch';

interface IGameRenderer extends IGameRendererBase {
  cameraMode?: CameraMode;
  onActionComplete?: () => void;
  onTeleportComplete?: () => void;
  environment?: 'day' | 'night';
}

const TILE_SIZE = 2;

// --- [THÊM MỚI] Component quản lý camera ---
const SceneCamera: React.FC<{ blocks: MazeConfig['blocks']; skipInitialPosition?: boolean }> = ({ blocks, skipInitialPosition = false }) => {
  const { camera } = useThree();

  useEffect(() => {
    // Nếu intro scene đang chạy, không đặt vị trí camera ban đầu
    if (skipInitialPosition) return;

    if (!blocks || blocks.length === 0) {
      camera.position.set(0, 30, 25);
      camera.lookAt(0, 0, 0);
      return;
    }

    const box = new THREE.Box3();
    blocks.forEach(block => {
      box.expandByPoint(new THREE.Vector3(
        block.position.x * TILE_SIZE,
        block.position.y * TILE_SIZE,
        block.position.z * TILE_SIZE
      ));
    });

    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);

    // [FIX] Check if the camera is a PerspectiveCamera before accessing 'fov'.
    const fovValue = camera instanceof THREE.PerspectiveCamera ? camera.fov : 60;

    const maxDim = Math.max(size.x, size.z); // Chỉ xét x và z để có góc nhìn tốt hơn
    const fov = fovValue * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 1.5 / Math.tan(fov / 2));
    cameraZ = Math.max(cameraZ, 15); // Đảm bảo camera không quá gần

    // Đặt camera ở một vị trí hợp lý, nhìn về phía trung tâm
    camera.position.set(center.x, center.y + cameraZ * 0.8, center.z + cameraZ);

    // Quan trọng: Hướng camera nhìn vào tâm của màn chơi
    camera.lookAt(center);

    // Cập nhật ma trận chiếu của camera
    camera.updateProjectionMatrix();

  }, [blocks, camera, skipInitialPosition]);

  return null; // Component này không render gì cả, chỉ để điều khiển camera
};

// --- Helper Components ---

const FinishMarker: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const height = 0.5;
  const radius = TILE_SIZE / 4;
  return (
    <mesh position={[position[0], position[1] + height / 2, position[2]]}>
      <cylinderGeometry args={[radius, radius, height, 32]} />
      <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
    </mesh>
  );
};

const Scene: React.FC<{
  gameConfig: MazeConfig;
  gameState: MazeGameState;
  onActionComplete: () => void;
  onTeleportComplete: () => void; // Nhận prop mới
  robotRef: React.RefObject<THREE.Group>;
}> = ({ gameConfig, gameState, onActionComplete, onTeleportComplete, robotRef }) => {
  const activePlayer = gameState.players[gameState.activePlayerId];

  const robotPosition = useMemo(() => {
    if (!activePlayer) return new THREE.Vector3(0, 0, 0);
    // For TeleportIn, the visual position should be the target, not the old logical position
    if (activePlayer.pose === 'TeleportIn' && activePlayer.teleportTarget) {
      const { x, y, z } = activePlayer.teleportTarget;
      return new THREE.Vector3(x * TILE_SIZE, (y - 1) * TILE_SIZE + TILE_SIZE / 2, z * TILE_SIZE);
    }
    const groundY = (activePlayer.y - 1) * TILE_SIZE;
    const surfaceY = groundY + TILE_SIZE / 2;

    return new THREE.Vector3(
      activePlayer.x * TILE_SIZE,
      surfaceY,
      activePlayer.z * TILE_SIZE
    );
  }, [activePlayer]);

  if (!activePlayer) return null;

  // DEBUG: Log all blocks being rendered  
  console.log('[Scene] Rendering blocks:', gameState.blocks.map(b => b.modelKey));

  return (
    <group>
      {gameState.blocks.map((block, index) => (
        <BlockComponent
          key={`block-${index}`}
          modelKey={block.modelKey}
          position={[
            block.position.x * TILE_SIZE,
            block.position.y * TILE_SIZE,
            block.position.z * TILE_SIZE
          ]}
        />
      ))}

      {gameState.collectibles.map((item) => (
        <Collectible
          key={item.id}
          collectibleType={item.type}
          position={[
            item.position.x * TILE_SIZE,
            (item.position.y - 1) * TILE_SIZE + TILE_SIZE / 2,
            item.position.z * TILE_SIZE,
          ]}
        />
      ))}

      {gameState.interactibles.map((item) => {
        if (item.type === 'portal') {
          const isActive = !item.controlSwitchId || gameState.interactiveStates[item.controlSwitchId] === 'on';
          return (
            <Portal
              key={item.id}
              color={item.color}
              isActive={isActive}
              position={[
                item.position.x * TILE_SIZE,
                (item.position.y - 0.54) * TILE_SIZE + 0.1,
                item.position.z * TILE_SIZE,
              ]}
            />
          );
        }
        if (item.type === 'switch') {
          const isOn = gameState.interactiveStates[item.id] === 'on';
          return (
            <SwitchComponent
              key={item.id}
              isOn={isOn}
              position={[
                item.position.x * TILE_SIZE,
                (item.position.y - 1) * TILE_SIZE + TILE_SIZE / 2,
                item.position.z * TILE_SIZE,
              ]}
            />
          );
        }
        return null;
      })}

      <FinishMarker
        position={[
          gameConfig.finish.x * TILE_SIZE,
          (gameConfig.finish.y - 1) * TILE_SIZE + TILE_SIZE / 2,
          (gameConfig.finish.z ?? gameConfig.finish.y) * TILE_SIZE
        ]}
      />

      <RobotCharacter
        ref={robotRef}
        position={robotPosition}
        direction={activePlayer.direction}
        animationName={activePlayer.pose || 'Idle'}
        onTweenComplete={onActionComplete}
        onTeleportOutComplete={onTeleportComplete}
        speech={activePlayer.speech}
      />
    </group>
  );
};

// --- Main Renderer Component ---

export const Maze3DRenderer: IGameRenderer = ({ gameState, gameConfig, cameraMode = 'Follow', onActionComplete = () => { }, onTeleportComplete = () => { }, environment = 'night' }) => {
  const mazeState = gameState as MazeGameState;
  const mazeConfig = gameConfig as MazeConfig;
  const robotRef = useRef<THREE.Group>(null);

  // --- Intro Scene State ---
  const introConfig = mazeConfig.introScene;
  const shouldPlayIntro = introConfig?.enabled === true;
  const [isIntroPlaying, setIsIntroPlaying] = useState(shouldPlayIntro);

  // Debug logs
  console.log('[DEBUG Intro] mazeConfig.introScene:', introConfig);
  console.log('[DEBUG Intro] shouldPlayIntro:', shouldPlayIntro);
  console.log('[DEBUG Intro] isIntroPlaying:', isIntroPlaying);

  // Reset intro state khi config thay đổi
  useEffect(() => {
    console.log('[DEBUG Intro] useEffect - shouldPlayIntro changed to:', shouldPlayIntro);
    setIsIntroPlaying(shouldPlayIntro);
  }, [shouldPlayIntro]);

  const handleIntroComplete = () => {
    console.log('[DEBUG Intro] handleIntroComplete called');
    setIsIntroPlaying(false);
  };

  const environmentNode = useMemo(() => {
    if (environment === 'day') {
      return (
        <>
          <Sky sunPosition={[100, 20, 100]} turbidity={0.5} rayleigh={0.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
          <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
            <Cloud opacity={0.6} speed={0.4} segments={20} position={[-20, 20, -20]} />
            <Cloud opacity={0.6} speed={0.3} segments={20} position={[20, 25, 20]} />
            <Cloud opacity={0.6} speed={0.5} segments={20} position={[0, 30, -30]} />
            <Cloud opacity={0.5} speed={0.2} segments={20} position={[-40, 25, 10]} />
            <Cloud opacity={0.7} speed={0.6} segments={20} position={[30, 15, -10]} />
            <Cloud opacity={0.5} speed={0.3} segments={20} position={[10, 35, 40]} />
          </Float>
          <ambientLight intensity={0.8} />
          <fog attach="fog" args={['#e0f7fa', 60, 150]} />
        </>
      );
    }
    return (
      <>
        <color attach="background" args={['#1a0c2b']} />
        <fog attach="fog" args={['#1a0c2b', 60, 110]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <Sparkles count={200} scale={[100, 50, 100]} size={6} speed={0.4} opacity={0.8} color="#ffffff" position={[0, 40, 0]} />
        <group position={[50, 40, -50]}>
          {/* Moon Mesh */}
          <mesh>
            <sphereGeometry args={[8, 32, 32]} />
            <meshBasicMaterial color="#ffffcc" />
          </mesh>
          {/* Moon Halo (Glare) */}
          <mesh>
            <sphereGeometry args={[12, 32, 32]} />
            <meshBasicMaterial color="#ffffcc" transparent opacity={0.15} side={THREE.BackSide} />
          </mesh>
        </group>
        <ambientLight intensity={0.4} />
      </>
    );
  }, [environment]);

  if (!mazeState || !mazeConfig) return null;

  return (
    // Canvas sẽ tự động chiếm 100% kích thước của div này.
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        {environmentNode}
        <directionalLight
          position={[10, 20, 35]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* SceneCamera chỉ đặt vị trí ban đầu nếu không có intro */}
        <SceneCamera blocks={mazeConfig.blocks} skipInitialPosition={isIntroPlaying} />

        {/* IntroSceneController điều khiển camera khi intro đang chạy */}
        {isIntroPlaying && introConfig && mazeConfig.blocks && (
          <IntroSceneController
            config={introConfig}
            blocks={mazeConfig.blocks}
            onComplete={handleIntroComplete}
          />
        )}

        {/* CameraRig nhận introMode để biết khi nào không điều khiển camera */}
        <CameraRig
          targetRef={robotRef}
          mode={cameraMode}
          introMode={isIntroPlaying}
        />

        <Scene
          gameConfig={mazeConfig}
          gameState={mazeState}
          onActionComplete={onActionComplete}
          robotRef={robotRef}
          onTeleportComplete={onTeleportComplete}
        />
      </Canvas>
    </div>
  );
};