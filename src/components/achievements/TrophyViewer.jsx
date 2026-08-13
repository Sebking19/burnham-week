import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

// IndexedDB cache for GLB models
const openDB = () => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('TrophyCache', 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore('models');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const getCachedModel = async (url) => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('models', 'readonly');
      const req = tx.objectStore('models').get(url);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

const cacheModel = async (url, blob) => {
  try {
    const db = await openDB();
    const tx = db.transaction('models', 'readwrite');
    tx.objectStore('models').put(blob, url);
  } catch {
    // Silently fail if caching doesn't work
  }
};

const fetchModelBlob = async (url) => {
  const cached = await getCachedModel(url);
  if (cached) {
    console.log('Loaded model from local cache');
    return cached;
  }
  const res = await fetch(url);
  const blob = await res.blob();
  cacheModel(url, blob);
  return blob;
};

function buildTrophyScene(canvas, width, height) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 3);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffd700, 1.5);
  dir.position.set(2, 3, 2);
  scene.add(dir);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.5);
  rim.position.set(-2, -1, -2);
  scene.add(rim);

  // Create a group for all trophy parts (for easier rotation)
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  // Trophy shape: cup + stem + base
  const gold = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.15 });

  // Cup (lathe geometry)
  const points = [];
  for (let i = 0; i <= 12; i++) {
   const t = i / 12;
   const r = 0.6 * Math.sin(t * Math.PI) * (0.7 + 0.3 * Math.sin(t * Math.PI * 2));
   points.push(new THREE.Vector2(r, t * 1.4 - 0.3));
  }
  const cup = new THREE.Mesh(new THREE.LatheGeometry(points, 32), gold);
  cup.castShadow = true;
  cup.receiveShadow = true;
  modelGroup.add(cup);

  // Stem
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 16), gold);
  stem.position.y = -0.55;
  stem.castShadow = true;
  stem.receiveShadow = true;
  modelGroup.add(stem);

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.12, 32), gold);
  base.position.y = -0.86;
  base.castShadow = true;
  base.receiveShadow = true;
  modelGroup.add(base);

  // Handles (torus segments)
  [-1, 1].forEach(side => {
   const handle = new THREE.Mesh(
     new THREE.TorusGeometry(0.22, 0.04, 8, 20, Math.PI),
     gold
   );
   handle.position.set(side * 0.6, 0.4, 0);
   handle.rotation.z = side * Math.PI / 2;
   handle.castShadow = true;
   handle.receiveShadow = true;
   modelGroup.add(handle);
  });

  return { renderer, scene, camera, modelGroup };
}

function buildScene(canvas, width, height) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 0, 3);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(5, 5, 5);
  scene.add(dir);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.6);
  rim.position.set(-5, -3, -5);
  scene.add(rim);

  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  return { renderer, scene, camera, modelGroup };
}

export default function TrophyViewer({ modelUrl, emoji, size = 120 }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0, rotY: 0, rotX: 0, velX: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sceneData = modelUrl 
      ? buildScene(canvas, size, size) 
      : buildTrophyScene(canvas, size, size);
    
    const { renderer, scene, camera, modelGroup } = sceneData;
    stateRef.current = sceneData;

    // Load GLB model if modelUrl is provided
    if (modelUrl) {
      fetchModelBlob(modelUrl).then((blob) => {
        blob.arrayBuffer().then((buffer) => {
          const loader = new GLTFLoader();
          loader.parse(buffer, '', (gltf) => {
            modelGroup.clear();
            const model = gltf.scene;
            
            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.5 / maxDim;

            model.position.sub(center);
            model.scale.multiplyScalar(scale);
            modelGroup.position.y = 0;
            modelGroup.add(model);
          }, undefined, (error) => {
            console.error('Failed to parse GLB model:', error);
          });
        }).catch(err => console.error('ArrayBuffer conversion failed:', err));
      }).catch(err => console.error('Fetch blob failed:', err));
    }

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const d = dragRef.current;
      if (!d.active) {
        d.velX *= 0.97;
        d.rotY += d.velX + 0.008;
      }
      modelGroup.rotation.y = d.rotY;
      modelGroup.rotation.x = d.rotX * 0.3;
      renderer.render(scene, camera);
    };
    animate();
    animRef.current = frame;
    
    console.log('Scene initialized', { hasModelUrl: !!modelUrl, sceneChildren: scene.children.length });

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
    };
  }, [modelUrl]);

  const onPointerDown = (e) => {
    dragRef.current.active = true;
    dragRef.current.lastX = e.clientX ?? e.touches?.[0]?.clientX;
    dragRef.current.lastY = e.clientY ?? e.touches?.[0]?.clientY;
    dragRef.current.velX = 0;
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.active) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    const dx = x - dragRef.current.lastX;
    const dy = y - dragRef.current.lastY;
    dragRef.current.velX = dx * 0.015;
    dragRef.current.rotY += dx * 0.015;
    dragRef.current.rotX += dy * 0.015;
    dragRef.current.lastX = x;
    dragRef.current.lastY = y;
  };

  const onPointerUp = () => { dragRef.current.active = false; };

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ width: size, height: size, touchAction: "none", cursor: "grab" }}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    />
  );
}