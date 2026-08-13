import { useEffect, useRef } from "react";
import * as THREE from "three";

// Real 3D water-themed objects drifting in the background.
// Built with raw three.js (same stable approach as TrophyViewer) — no react-three-fiber.

function makeLifebuoy() {
  const group = new THREE.Group();
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const color = i % 2 === 0 ? 0xf87171 : 0xffffff;
    const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.22, roughness: 0.4 });
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.32, 10, 12, (Math.PI * 2) / segments),
      mat
    );
    arc.rotation.z = (i * Math.PI * 2) / segments;
    group.add(arc);
  }
  return group;
}

function makeBubbles() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9, transparent: true, opacity: 0.14, roughness: 0.1, metalness: 0.2,
  });
  [[0, 0, 0, 0.5], [0.7, 0.6, 0.2, 0.3], [0.4, -0.6, -0.2, 0.2], [-0.6, 0.4, 0.1, 0.25]].forEach(([x, y, z, r]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), mat);
    b.position.set(x, y, z);
    group.add(b);
  });
  return group;
}

function makeAnchor() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.22, metalness: 0.6, roughness: 0.3 });
  // Shank
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 10), mat);
  group.add(shank);
  // Ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 16), mat);
  ring.position.y = 0.95;
  group.add(ring);
  // Stock (crossbar)
  const stock = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), mat);
  stock.rotation.z = Math.PI / 2;
  stock.position.y = 0.6;
  group.add(stock);
  // Arms (curved bottom)
  const arms = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 16, Math.PI), mat);
  arms.rotation.z = Math.PI;
  arms.position.y = -0.5;
  group.add(arms);
  // Flukes
  [-1, 1].forEach((side) => {
    const fluke = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 8), mat);
    fluke.position.set(side * 0.55, -0.35, 0);
    group.add(fluke);
  });
  return group;
}

function makeBuoy() {
  const group = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0xf87171, transparent: true, opacity: 0.22, roughness: 0.4 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 16), red);
  group.add(body);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), white);
  pole.position.y = 0.9;
  group.add(pole);
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), white);
  light.position.y = 1.35;
  group.add(light);
  return group;
}

const OBJECT_DEFS = [
  { make: makeLifebuoy, x: -3.6, y: 1.8, z: -2, scale: 0.8, spin: 0.15 },
  { make: makeAnchor, x: 3.8, y: -1.6, z: -3, scale: 0.9, spin: 0.1 },
  { make: makeBubbles, x: 4.2, y: 1.4, z: -1.5, scale: 0.9, spin: 0.08 },
  { make: makeBuoy, x: -3.4, y: -2.0, z: -2.5, scale: 0.85, spin: 0.12 },
  { make: makeBubbles, x: -0.5, y: 2.4, z: -4, scale: 0.7, spin: 0.06 },
];

export default function Underwater3DBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const cyan = new THREE.PointLight(0x67e8f9, 1.2, 30);
    cyan.position.set(0, 6, 4);
    scene.add(cyan);
    const blue = new THREE.DirectionalLight(0x38bdf8, 0.6);
    blue.position.set(-4, -3, 5);
    scene.add(blue);

    const objects = OBJECT_DEFS.map((def) => {
      const obj = def.make();
      obj.position.set(def.x, def.y, def.z);
      obj.scale.setScalar(def.scale);
      obj.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
      scene.add(obj);
      return { obj, def, phase: Math.random() * Math.PI * 2 };
    });

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (reduceMotion) renderer.render(scene, camera);
    };
    window.addEventListener("resize", onResize);

    let frame;
    if (reduceMotion) {
      renderer.render(scene, camera);
    } else {
      const animate = (t) => {
        frame = requestAnimationFrame(animate);
        const time = t * 0.001;
        objects.forEach(({ obj, def, phase }) => {
          obj.position.y = def.y + Math.sin(time * 0.35 + phase) * 0.35;
          obj.position.x = def.x + Math.cos(time * 0.22 + phase) * 0.25;
          obj.rotation.y += def.spin * 0.008;
          obj.rotation.x = Math.sin(time * 0.3 + phase) * 0.15;
        });
        renderer.render(scene, camera);
      };
      frame = requestAnimationFrame(animate);
    }

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          child.material?.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 0, opacity: 0.8 }}
    />
  );
}