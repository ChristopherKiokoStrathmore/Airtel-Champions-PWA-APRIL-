// RubiksCube.tsx — Airtel Champions 3D logo cube for the login mode selector.
//
// Brightness fix (2026-03-25)
// ────────────────────────────
// Switched from MeshStandardMaterial (PBR, affected by lights) to
// MeshBasicMaterial (unlit, always full-brightness).  This makes the Airtel
// red in the logo pop at 100 % saturation regardless of scene lighting.
// The three-point lighting rig is kept for the subtle specular highlights on
// the cube edges that MeshBasicMaterial still respects via the geometry shading
// — actually MeshBasicMaterial ignores lights entirely, so we keep them only
// as ambient colour contributors if we decide to mix materials later.
//
// Interaction
// ────────────
// • Click → onToggle() is called + +180° added to target Y rotation.
// • Smooth lerp (delta*7) means the half-turn finishes in ~0.4 s.
// • Continuous gentle X-axis tilt keeps the cube feeling alive.

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// ─── Inner mesh ───────────────────────────────────────────────────────────────
// Must live inside the Canvas so R3F hooks (useFrame, useTexture) work.

interface LogoCubeMeshProps {
  logoSrc: string;
  onToggle: () => void;
}

function LogoCubeMesh({ logoSrc, onToggle }: LogoCubeMeshProps) {
  const meshRef  = useRef<THREE.Mesh>(null);
  // Accumulated target Y rotation — each click adds π (180°).
  const targetY  = useRef(0);

  // Load logo via drei's useTexture.  Suspends until the image is ready;
  // the parent <Suspense> in LoginPage shows the static logo fallback meanwhile.
  const texture = useTexture(logoSrc);

  // Ensure the texture is not filtered down (keeps crisp logo pixels).
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const handleClick = () => {
    targetY.current += Math.PI; // +180° per tap
    onToggle();
  };

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Lerp toward the next 180° stop
    mesh.rotation.y = THREE.MathUtils.lerp(
      mesh.rotation.y,
      targetY.current,
      Math.min(1, delta * 7), // completes in ~0.4 s
    );

    // Gentle idle breathing tilt on X
    mesh.rotation.x = Math.sin(Date.now() * 0.0006) * 0.06;
  });

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() =>  { document.body.style.cursor = 'default';  }}
      castShadow
    >
      <boxGeometry args={[2.4, 2.4, 2.4]} />
      {/*
        MeshBasicMaterial ignores all scene lighting and renders the texture
        at 100 % brightness / saturation — exactly what we want for a logo.
        The Airtel reds will be vivid (#E60000) with no darkening from the
        PBR lighting model.
      */}
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export interface RubiksCubeProps {
  /** Resolved URL / data-URL of the logo PNG to apply to all six faces */
  logoSrc: string;
  /** Fired once per click, after the spin is triggered */
  onToggle: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a 3D spinning logo cube inside an R3F Canvas.
 * The parent element controls the canvas size via CSS width/height.
 */
export function RubiksCube({ logoSrc, onToggle, className, style }: RubiksCubeProps) {
  return (
    <div
      data-testid="mode-selector"
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    >
      <Canvas
        camera={{ position: [0, 0.3, 5.6], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        {/*
          Lights are kept for potential future use (e.g. if we add a
          MeshStandardMaterial overlay for edge highlights), but they have
          no effect on MeshBasicMaterial faces.
        */}
        <ambientLight intensity={1.0} />
        <pointLight position={[5, 5, 5]} intensity={1.5} />

        <LogoCubeMesh logoSrc={logoSrc} onToggle={onToggle} />
      </Canvas>
    </div>
  );
}

// Shared type re-exported so LoginPage only needs one import from this file
export type AppMode = 'sales' | 'hbb';
