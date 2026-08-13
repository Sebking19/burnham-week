import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

function Model({ modelUrl }) {
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      const box = new THREE.Box3().setFromObject(groupRef.current);
      const center = box.getCenter(new THREE.Vector3());
      groupRef.current.position.sub(center);
      
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3 / maxDim;
      groupRef.current.scale.multiplyScalar(scale);
    }
  }, [scene]);

  return <primitive ref={groupRef} object={scene} />;
}

export default function GLBViewer({ modelUrl, size = 200 }) {
  if (!modelUrl) return null;

  return (
    <div style={{ width: size, height: size, borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
      <Canvas>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Model modelUrl={modelUrl} />
        <OrbitControls autoRotate />
      </Canvas>
    </div>
  );
}