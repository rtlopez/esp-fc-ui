import { FC, PropsWithChildren } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei'
import { Quaternion } from '@/api/spatial'

type Preview3DModelProps = PropsWithChildren & {
  attitudeQ: Quaternion
}

const Preview3DModel: FC<Preview3DModelProps> = ({ attitudeQ, children }) => {

  return <Canvas style={{ height: 240, width: '100%' }} className="mb-3 border">
    <ambientLight intensity={0.6} />
    <directionalLight position={[5, 10, 7]} intensity={0.6} />
    <Grid
      args={[10, 10]} // Large grid size
      cellSize={0.5}
      cellThickness={0.5}
      cellColor="#ccc"
      sectionSize={2.5}
      sectionThickness={0.75}
      sectionColor="#aaa"
      fadeDistance={20}
      fadeStrength={1}
      position={[0, -1, 0]}
      infiniteGrid // This makes the grid appear infinite
    />
    <group
      position={[0, 0, 0]}
      quaternion={attitudeQ.toUi()}
    >
      {children}
    </group>
    <PerspectiveCamera makeDefault position={[0, 0.7, 2]} fov={40} rotation={[-Math.PI * 0.1, 0, 0]} />
    {/* eslint-disable-next-line no-constant-condition */}
    {false ? <OrbitControls target={[0, 0.2, 0]} enablePan={true} minDistance={1} maxDistance={10} maxPolarAngle={Math.PI / 2.2} /> : null}
  </Canvas>

}

export default Preview3DModel