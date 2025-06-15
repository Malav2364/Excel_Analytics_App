import React, { forwardRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const Scatter3DChart = forwardRef(({ data, config }, ref) => {
  if (!data || !config || !config.xAxis || !config.yAxis || !config.zAxis) return null; // Ensure zAxis is also expected

  const points = data.reduce((acc, item, idx) => {
    const rawX = item[config.xAxis];
    const rawY = item[config.yAxis];
    const rawZ = item[config.zAxis];

    const x = parseFloat(rawX);
    const y = parseFloat(rawY);
    const z = parseFloat(rawZ);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      console.warn(`Scatter3DChart: Skipping data point at index ${idx} due to invalid coordinates: X=${rawX}, Y=${rawY}, Z=${rawZ}`);
      return acc;
    }

    acc.push(
      <mesh key={idx} position={[x, y, z]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={'#2196f3'} />
      </mesh>
    );
    return acc;
  }, []);

  if (points.length === 0) {
    return (
      <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>No valid data to display for Scatter3DChart.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 400 }}>
      <Canvas ref={ref} shadows gl={{ preserveDrawingBuffer: true }}>
        <color attach="background" args={['#ffffff']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <PerspectiveCamera makeDefault position={[10, 10, 20]} />
        <OrbitControls />
        {points}
      </Canvas>
    </div>
  );
});

export default Scatter3DChart;