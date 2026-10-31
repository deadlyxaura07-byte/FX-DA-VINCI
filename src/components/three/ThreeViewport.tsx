import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ThreeClipConfig } from '../../types/timeline';
import { buildComposite3DSubject, createTechGridTexture } from './proceduralModels';
import { RotateCw, Sparkles, Box, Palette, ChevronDown, ChevronUp } from 'lucide-react';

interface ThreeViewportProps {
  config: ThreeClipConfig;
  onChangeConfig?: (updated: Partial<ThreeClipConfig>) => void;
  isOverlayMode?: boolean;
}

// Scratch objects outside the render loop for zero GC
const _vec3 = new THREE.Vector3();

export const ThreeViewport: React.FC<ThreeViewportProps> = ({
  config,
  onChangeConfig,
  isOverlayMode = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const subjectGroupRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL from GPU renderer string
    const glProbe = document.createElement('canvas').getContext('webgl2');
    let isSoftwareGl = false;
    if (glProbe) {
      const ext = glProbe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : glProbe.RENDERER;
      const gpu = String(glProbe.getParameter(param));
      glProbe.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } else {
      isSoftwareGl = true;
    }

    // 2. Setup WebGLRenderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    rendererRef.current = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 480;
    renderer.setSize(width, height);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    if (!isOverlayMode) {
      scene.background = new THREE.Color(0x090d16);
      scene.fog = new THREE.FogExp2(0x090d16, 0.04);
    }

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 6.8);
    camera.lookAt(0, 1.8, 0);
    cameraRef.current = camera;

    // 4. RoomEnvironment for realistic PBR metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Balanced 3-Point Lighting Rig
    // Warm directional key light
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.5);
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool Hemisphere fill light
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x1e1b4b, 1.2);
    scene.add(hemiLight);

    // Rim/Backlight
    const rimLight = new THREE.DirectionalLight(0xec4899, 1.8);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Tech Grid floor (non-overlay mode)
    if (!isOverlayMode) {
      const gridTex = createTechGridTexture();
      gridTex.repeat.set(4, 4);
      const floorGeo = new THREE.PlaneGeometry(30, 30);
      const floorMat = new THREE.MeshStandardMaterial({
        map: gridTex,
        roughness: 0.8,
        metalness: 0.2,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = !isSoftwareGl;
      scene.add(floor);
    }

    // 6. Build Composite Procedural Subject
    const subject = buildComposite3DSubject(config);
    scene.add(subject);
    subjectGroupRef.current = subject;

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Lossless Animation Loop with Exponential Damping
    let frameId = 0;
    let lastTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (subjectGroupRef.current) {
        // Smooth rotation
        const speedMultiplier = config.speed || 1;
        subjectGroupRef.current.rotation.y += 0.6 * dt * speedMultiplier;

        // Sub-part movements
        const gimbal1 = subjectGroupRef.current.getObjectByName('gimbal1');
        if (gimbal1) gimbal1.rotation.x += 1.2 * dt * speedMultiplier;
        const gimbal2 = subjectGroupRef.current.getObjectByName('gimbal2');
        if (gimbal2) gimbal2.rotation.z += 0.9 * dt * speedMultiplier;
        const halo = subjectGroupRef.current.getObjectByName('halo');
        if (halo) halo.rotation.y += 1.5 * dt * speedMultiplier;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [config.scenePreset, config.colorScheme, config.wireframe, isOverlayMode]);

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-xl bg-zinc-950 flex flex-col justify-end">
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Preset Indicator Tag */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold text-white">Three.js 3D Track</span>
        <span className="text-zinc-500">•</span>
        <span className="text-zinc-400 capitalize">{config.scenePreset.replace(/-/g, ' ')}</span>
      </div>

      {/* Collapsible Ergonomic Bottom Dock (zero viewport occlusion) */}
      <div className="relative z-10 mx-auto mb-3 max-w-[94%] transition-transform duration-200">
        {/* Toggle Drawer */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-t-md text-[11px] text-zinc-400 hover:text-white transition"
          >
            {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isCollapsed ? 'Show 3D Controls' : 'Hide Controls'}
          </button>
        </div>

        {!isCollapsed && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-zinc-900/95 border border-zinc-800 rounded-xl shadow-2xl text-xs text-zinc-200">
            {/* Preset Selector */}
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-sky-400" />
              <select
                value={config.scenePreset}
                onChange={(e) => onChangeConfig?.({ scenePreset: e.target.value as any })}
                className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
              >
                <option value="cyber-cube-hud">Quantum Core HUD (7 Parts)</option>
                <option value="kinetic-3d-title">Kinetic Title Plaque (5 Parts)</option>
                <option value="floating-trophy">Floating Diamond Trophy (6 Parts)</option>
              </select>
            </div>

            {/* Color Scheme */}
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-fuchsia-400" />
              <select
                value={config.colorScheme}
                onChange={(e) => onChangeConfig?.({ colorScheme: e.target.value as any })}
                className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
              >
                <option value="gold-lux">Gold Luxury</option>
                <option value="cyber-cyan">Cyber Cyan</option>
                <option value="neon-magenta">Neon Magenta</option>
                <option value="emerald">Emerald Matrix</option>
                <option value="monochrome">Monochrome Slate</option>
              </select>
            </div>

            {/* Wireframe Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={config.wireframe}
                onChange={(e) => onChangeConfig?.({ wireframe: e.target.checked })}
                className="rounded border-zinc-700 text-sky-500 focus:ring-0"
              />
              <span>Wireframe</span>
            </label>

            {/* Speed slider */}
            <div className="flex items-center gap-2">
              <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400 text-[11px]">{config.speed}x</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.2"
                value={config.speed}
                onChange={(e) => onChangeConfig?.({ speed: parseFloat(e.target.value) })}
                className="w-20 accent-sky-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
