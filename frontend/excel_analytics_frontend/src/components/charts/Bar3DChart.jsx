import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const Bar3DChart = ({ data, config }) => {
  if (!data || !config || !config.xAxis || !config.yAxis) return null;
  const bars = data.map((item, idx) => {
    const x = idx * 2;
    const y = item[config.yAxis];
    return (
      <mesh key={idx} position={[x, y / 2, 0]}>
        <boxGeometry args={[1, y, 1]} />
        <meshStandardMaterial color={'#4caf50'} />
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
        {bars}
      </Canvas>
    </div>
  );
};
export default Bar3DChart; 