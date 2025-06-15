import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const Scatter3DChart = ({ data, config }) => {
  if (!data || !config || !config.xAxis || !config.yAxis) return null;
  // Use a third axis if available, otherwise use index
  const zAxis = config.zAxis || null;
  const points = data.map((item, idx) => {
    const x = item[config.xAxis];
    const y = item[config.yAxis];
    const z = zAxis && item[zAxis] ? item[zAxis] : idx;
    return (
      <mesh key={idx} position={[x, y, z]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={'#2196f3'} />
      </mesh>
    );
  });
  return (
    <div style={{ width: '100%', height: 400 }}>
      <Canvas shadows>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <PerspectiveCamera makeDefault position={[10, 10, 20]} />
        <OrbitControls />
        {points}
      </Canvas>
    </div>
  );
};
export default Scatter3DChart; 