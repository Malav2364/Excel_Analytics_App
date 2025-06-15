import React, { forwardRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

const Bar3DChart = forwardRef(({ data, config }, ref) => {
  if (!data || !config || !config.xAxis || !config.yAxis) return null;

  const bars = data.reduce((acc, item, idx) => {
    const rawY = item[config.yAxis];
    const y = parseFloat(rawY);

    if (isNaN(y)) { // Only check for NaN, as 0 is a valid height
      console.warn(`Bar3DChart: Skipping data point at index ${idx} due to invalid Y-axis value: ${rawY}`);
      return acc;
    }

    // Assuming x is based on index for now. If config.xAxis should be numeric, parse it too.
    const x = idx * 2; 

    // Ensure y/2 is also valid. If y is 0, y/2 is 0.
    const positionY = y / 2;
    const barHeight = Math.abs(y) === 0 ? 0.001 : Math.abs(y); // Give a tiny height if y is 0 to avoid NaN issues in geometry, or filter out y=0 points

    acc.push(
      <mesh key={idx} position={[x, positionY, 0]}> 
        <boxGeometry args={[1, barHeight, 1]} /> 
        <meshStandardMaterial color={'#4caf50'} />
      </mesh>
    );
    return acc;
  }, []);

  if (bars.length === 0) {
    return (
      <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>No valid data to display for Bar3DChart.</p>
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
        {bars}
      </Canvas>
    </div>
  );
});
export default Bar3DChart;