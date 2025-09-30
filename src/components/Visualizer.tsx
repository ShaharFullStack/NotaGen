import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LegData } from '../hooks/useLegTracking';

interface VisualizerProps {
  leftLegData: LegData;
  rightLegData: LegData;
  scaleNotes: string[];
  chords: string[][];
}

function CircleSlices({ position, color, activeSlice }: { position: [number, number, number], color: string, activeSlice: number }) {
  const numSlices = 8;
  const slices = [];

  for (let i = 0; i < numSlices; i++) {
    const startAngle = (i / numSlices) * Math.PI * 2;
    const endAngle = ((i + 1) / numSlices) * Math.PI * 2;

    const isActive = i === activeSlice;
    const opacity = isActive ? 0.7 : 0.3;
    const sliceColor = isActive ? color : '#1e293b';

    slices.push(
      <mesh key={i} position={position}>
        <circleGeometry args={[2.5, 32, startAngle, endAngle - startAngle]} />
        <meshBasicMaterial color={sliceColor} transparent opacity={opacity} side={THREE.DoubleSide} />
      </mesh>
    );
  }

  return <>{slices}</>;
}

function LegMarker({ position, color, isActive, distance }: { position: [number, number, number], color: string, isActive: boolean, distance: number }) {
  if (!isActive) return null;

  const opacity = Math.min(distance / 200, 1.0);
  const size = 0.3 + (distance / 500);

  return (
    <mesh position={position}>
      <circleGeometry args={[size, 32]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

export default function Visualizer({ leftLegData, rightLegData, scaleNotes, chords }: VisualizerProps) {
  const leftCircleRef = useRef<THREE.Mesh>(null);
  const rightCircleRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (leftCircleRef.current) {
      leftCircleRef.current.rotation.z += 0.001;
    }
    if (rightCircleRef.current) {
      rightCircleRef.current.rotation.z -= 0.001;
    }
  });

  const leftMarkerPos: [number, number, number] = [
    -4 + leftLegData.x * 2.0,
    -leftLegData.y * 2.0,
    0.1
  ];

  const rightMarkerPos: [number, number, number] = [
    4 + rightLegData.x * 2.0,
    -rightLegData.y * 2.0,
    0.1
  ];

  return (
    <>
      <ambientLight intensity={0.6} />

      {/* Left Circle (Melody) */}
      <mesh ref={leftCircleRef} position={[-4, 0, 0]}>
        <ringGeometry args={[2.5, 2.6, 64]} />
        <meshBasicMaterial color="#4f46e5" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      <CircleSlices
        position={[-4, 0, -0.1]}
        color="#4f46e5"
        activeSlice={leftLegData.isActive ? leftLegData.slice : -1}
      />

      <LegMarker
        position={leftMarkerPos}
        color="#3b82f6"
        isActive={leftLegData.isActive}
        distance={leftLegData.distance}
      />

      {/* Right Circle (Harmony) */}
      <mesh ref={rightCircleRef} position={[4, 0, 0]}>
        <ringGeometry args={[2.5, 2.6, 64]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>

      <CircleSlices
        position={[4, 0, -0.1]}
        color="#8b5cf6"
        activeSlice={rightLegData.isActive ? rightLegData.slice : -1}
      />

      <LegMarker
        position={rightMarkerPos}
        color="#a855f7"
        isActive={rightLegData.isActive}
        distance={rightLegData.distance}
      />
    </>
  );
}