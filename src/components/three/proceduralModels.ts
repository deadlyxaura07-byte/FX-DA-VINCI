import * as THREE from 'three';
import { ThreeClipConfig } from '../../types/timeline';

/**
 * Creates procedural texture canvas for brushed metal anisotropy & tech grid
 */
export function createTechGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle grid
  ctx.strokeStyle = 'rgba(70, 140, 255, 0.25)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Tech crosshairs & dots
  ctx.fillStyle = 'rgba(255, 120, 220, 0.6)';
  for (let x = 64; x < 512; x += 128) {
    for (let y = 64; y < 512; y += 128) {
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Builds a composite 3-12 part procedural model as required by Three.js architecture guidelines.
 * Never a single primitive. Varied roughness/metalness, bevels, distinct parts.
 */
export function buildComposite3DSubject(config: ThreeClipConfig): THREE.Group {
  const root = new THREE.Group();
  const palette = getColorPalette(config.colorScheme);

  if (config.scenePreset === 'cyber-cube-hud') {
    // 7-part Holographic Quantum Core
    // 1. Central Core Cube (Primary)
    const coreGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: palette.primary,
      metalness: 0.9,
      roughness: 0.15,
      wireframe: config.wireframe,
      clearcoat: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 1.8;
    root.add(coreMesh);

    // 2 & 3. Gimbal Rings (Secondary Read)
    const ringGeo1 = new THREE.TorusGeometry(1.5, 0.08, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: palette.secondary,
      metalness: 0.8,
      roughness: 0.4,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat);
    ring1.position.y = 1.8;
    ring1.name = 'gimbal1';
    root.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(1.9, 0.06, 16, 64);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat);
    ring2.position.y = 1.8;
    ring2.rotation.x = Math.PI / 3;
    ring2.name = 'gimbal2';
    root.add(ring2);

    // 4 & 5. Orbiting Quantum Nodes (Accents)
    const nodeGeo = new THREE.OctahedronGeometry(0.25, 0);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: palette.accent,
      emissive: palette.accent,
      emissiveIntensity: 0.6,
      metalness: 0.2,
      roughness: 0.1,
    });
    const node1 = new THREE.Mesh(nodeGeo, nodeMat);
    node1.position.set(2.4, 1.8, 0);
    node1.name = 'node1';
    root.add(node1);

    const node2 = new THREE.Mesh(nodeGeo, nodeMat);
    node2.position.set(-2.4, 1.8, 0);
    node2.name = 'node2';
    root.add(node2);

    // 6. Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.8, 2.2, 0.4, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.6,
      roughness: 0.5,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.2;
    root.add(baseMesh);

    // 7. Contact Shadow Grounding Disc
    const shadowGeo = new THREE.PlaneGeometry(5, 5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    root.add(shadowMesh);
  } else if (config.scenePreset === 'kinetic-3d-title') {
    // 5-part Kinetic Title Plaque with Beveled Trim & Pillars
    // 1. Main Monolith Body
    const monoGeo = new THREE.BoxGeometry(3.6, 1.2, 0.4);
    const monoMat = new THREE.MeshPhysicalMaterial({
      color: 0x0e1420,
      metalness: 0.85,
      roughness: 0.2,
      clearcoat: 1.0,
    });
    const monoMesh = new THREE.Mesh(monoGeo, monoMat);
    monoMesh.position.y = 1.8;
    root.add(monoMesh);

    // 2. Beveled Golden Frame Accent
    const frameGeo = new THREE.BoxGeometry(3.8, 1.4, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({
      color: palette.primary,
      metalness: 0.95,
      roughness: 0.15,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 1.8, -0.15);
    root.add(frameMesh);

    // 3 & 4. Twin Stabilizer Columns
    const colGeo = new THREE.CylinderGeometry(0.12, 0.16, 2.4, 16);
    const colMat = new THREE.MeshStandardMaterial({
      color: palette.secondary,
      metalness: 0.7,
      roughness: 0.35,
    });
    const leftCol = new THREE.Mesh(colGeo, colMat);
    leftCol.position.set(-2.0, 1.2, 0);
    root.add(leftCol);

    const rightCol = new THREE.Mesh(colGeo, colMat);
    rightCol.position.set(2.0, 1.2, 0);
    root.add(rightCol);

    // 5. Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(5, 3);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    root.add(shadowMesh);
  } else {
    // 6-part Floating Diamond Trophy / Vortex
    // 1. Faceted Diamond Jewel (Primary)
    const jewelGeo = new THREE.OctahedronGeometry(1.2, 1);
    const jewelMat = new THREE.MeshPhysicalMaterial({
      color: palette.primary,
      metalness: 0.95,
      roughness: 0.1,
      clearcoat: 1.0,
      wireframe: config.wireframe,
    });
    const jewelMesh = new THREE.Mesh(jewelGeo, jewelMat);
    jewelMesh.position.y = 2.0;
    jewelMesh.name = 'jewel';
    root.add(jewelMesh);

    // 2. Encircling Energy Halo
    const haloGeo = new THREE.TorusGeometry(1.8, 0.05, 16, 80);
    const haloMat = new THREE.MeshStandardMaterial({
      color: palette.accent,
      emissive: palette.accent,
      emissiveIntensity: 0.8,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.y = 2.0;
    haloMesh.rotation.x = Math.PI / 2.5;
    haloMesh.name = 'halo';
    root.add(haloMesh);

    // 3. Floating Wing Fin Left
    const wingGeo = new THREE.ConeGeometry(0.3, 1.2, 4);
    const wingMat = new THREE.MeshStandardMaterial({
      color: palette.secondary,
      metalness: 0.8,
      roughness: 0.25,
    });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-1.6, 2.0, 0);
    leftWing.rotation.z = Math.PI / 3;
    root.add(leftWing);

    // 4. Floating Wing Fin Right
    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(1.6, 2.0, 0);
    rightWing.rotation.z = -Math.PI / 3;
    root.add(rightWing);

    // 5. Tiered Stage Plinth
    const stageGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.5, 32);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x121620,
      metalness: 0.7,
      roughness: 0.4,
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = 0.25;
    root.add(stageMesh);

    // 6. Grounding Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(4.5, 4.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    root.add(shadowMesh);
  }

  return root;
}

function getColorPalette(scheme: string) {
  switch (scheme) {
    case 'cyber-cyan':
      return { primary: 0x00f0ff, secondary: 0x0066ff, accent: 0xff0077 };
    case 'neon-magenta':
      return { primary: 0xff0077, secondary: 0x8a00e6, accent: 0x00f0ff };
    case 'emerald':
      return { primary: 0x10b981, secondary: 0x059669, accent: 0x34d399 };
    case 'monochrome':
      return { primary: 0xe2e8f0, secondary: 0x64748b, accent: 0xffffff };
    case 'gold-lux':
    default:
      return { primary: 0xf59e0b, secondary: 0xd97706, accent: 0xfef08a };
  }
}
