
const DroneX = () => (
  <group>
    {/* Flat arrow on top of body, pointing forward (positive Z) */}
    <mesh position={[0.0, 0.25, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Arrow shaft */}
      <cylinderGeometry args={[0.015, 0.015, 0.30, 6]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
    <mesh position={[0, 0.25, -0.34]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Arrow head */}
      <coneGeometry args={[0.04, 0.08, 16]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>

    {/* Body */}
    <mesh position={[0, 0.2, 0]}>
      <boxGeometry args={[0.25, 0.1, 0.6]} />
      <meshStandardMaterial color="#aaaaaa" />
    </mesh>

    {/* Arms */}
    <mesh position={[0.0, 0.2, 0.0]} rotation={[0, Math.PI / 4, 0]}>
      <boxGeometry args={[1.5, 0.03, 0.05]} />
      <meshStandardMaterial color="#757575" />
    </mesh>
    <mesh position={[0.0, 0.2, 0.0]} rotation={[0, -Math.PI / 4, 0]}>
      <boxGeometry args={[1.5, 0.03, 0.05]} />
      <meshStandardMaterial color="#757575" />
    </mesh>

    {/* Rotors */}
    <mesh position={[0.5, 0.22, 0.5]}>
      <cylinderGeometry args={[0.25, 0.25, 0.01, 24]} />
      <meshStandardMaterial color="#33ff00" transparent opacity={0.8} />
    </mesh>
    <mesh position={[-0.5, 0.22, 0.5]}>
      <cylinderGeometry args={[0.25, 0.25, 0.01, 24]} />
      <meshStandardMaterial color="#33ff00" transparent opacity={0.8} />
    </mesh>
    <mesh position={[0.5, 0.22, -0.5]}>
      <cylinderGeometry args={[0.25, 0.25, 0.01, 24]} />
      <meshStandardMaterial color="#ff0000" transparent opacity={0.8} />
    </mesh>
    <mesh position={[-0.5, 0.22, -0.5]}>
      <cylinderGeometry args={[0.25, 0.25, 0.01, 24]} />
      <meshStandardMaterial color="#ff0000" transparent opacity={0.8} />
    </mesh>
  </group>
)

export default DroneX