import { useEffect, useState } from 'react'
import { useSerial } from '@/api/serial/SerialProvider'
import { useMsp } from '@/api/msp/MspProvider'
import { MspMessage, MspCommand } from '@/api/msp/msp'
import { AttitudeIndicator, HeadingIndicator } from 'react-typescript-flight-indicators'
import { Badge, Card, Col, ListGroup, Row } from 'react-bootstrap'
import TabView from './TabView'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei'
import { Euler, EulerDeg, eulerInDeg, Quaternion, quaternionDeviceToUi, quaternionFromDevice, quaternionToEuler } from '@/api/spatial'

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
      <meshStandardMaterial color="#33ff00" />
    </mesh>
    <mesh position={[-0.5, 0.22, 0.5]}>
      <cylinderGeometry args={[0.25, 0.25, 0.01, 24]} />
      <meshStandardMaterial color="#33ff00" />
    </mesh>
    <mesh position={[0.5, 0.22, -0.5]}>
      <cylinderGeometry args={[0.25, 0.25, 0.01, 24]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
    <mesh position={[-0.5, 0.22, -0.5]}>
      <cylinderGeometry args={[0.25, 0.25, 0.01, 24]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
  </group>
)

const StatusTab = () => {

  const [attitude, setAttitude] = useState<Euler & EulerDeg>({ roll: 0, pitch: 0, yaw: 0, rollDeg: 0, pitchDeg: 0, yawDeg: 0 })
  const [attitudeQ, setAttitudeQ] = useState<Quaternion>({ x: 0, y: 0, z: 0, w: 1 })
  const { connected } = useSerial()
  const { subscribeMsp, writeMsp } = useMsp()

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => {
      //writeMsp(new MspMessage(MspCommand.MSP_ATTITUDE.value, MspCommand.MSP_ATTITUDE.variant))
      writeMsp(new MspMessage(MspCommand.ESP_CMD_ATTITUDE.value, MspCommand.ESP_CMD_ATTITUDE.variant))
    }, 100);
    return () => {
      clearInterval(interval);
    };
  }, [connected, writeMsp]);

  useEffect(() => {
    if (!connected) return;
    return subscribeMsp((msg: MspMessage) => {
      const q = quaternionFromDevice(msg.read16(), msg.read16(), msg.read16(), msg.read16())
      const e = quaternionToEuler(q)
      setAttitudeQ(q)
      setAttitude({ ...e, ...eulerInDeg(e) })
    })
  }, [connected, subscribeMsp])

  const attitudeStr = `${attitude.rollDeg.toFixed(1)}\u00b0 x ${attitude.pitchDeg.toFixed(1)}\u00b0`
  const headingStr = `${attitude.yawDeg.toFixed(1)}\u00b0`

  return <TabView title='Status' nosave>
    <Row>
      <Col>
        <Canvas style={{ height: 240, width: '100%' }}>
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
            quaternion={quaternionDeviceToUi(attitudeQ).toArray!()}
          >
            <DroneX />
          </group>
          <PerspectiveCamera makeDefault position={[0, 0.7, 2]} fov={40} rotation={[-Math.PI * 0.1, 0, 0]} />
          {/* eslint-disable-next-line no-constant-condition */}
          {false ? <OrbitControls target={[0, 0.2, 0]} enablePan={true} minDistance={1} maxDistance={10} maxPolarAngle={Math.PI / 2.2} /> : null}
        </Canvas>
      </Col>
    </Row>

    <Row>
      <Col md={6}>
        <Card>
          <Card.Header>Instruments</Card.Header>
          <Card.Body>
            <Row>
              <Col xs={6} className='text-center'>
                <AttitudeIndicator roll={-attitude.rollDeg} pitch={-attitude.pitchDeg} showBox={false} size='160px' />
                <br />
                Attitude {attitudeStr}
              </Col>
              <Col xs={6} className='text-center'>
                <HeadingIndicator heading={attitude.yawDeg} showBox={false} size='160px' />
                <br />
                Heading {headingStr}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
      <Col md={6}>
        <Card>
          <Card.Header>Pre-Flight Checks</Card.Header>
          <Card.Body>
            <ListGroup>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Battery</span>
                <Badge bg="success">OK</Badge>
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>GPS</span>
                <Badge bg="success">OK</Badge>
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Barometer</span>
                <Badge bg="success">OK</Badge>
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Compass</span>
                <Badge bg="success">OK</Badge>
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>
    </Row>

  </TabView>
}

export default StatusTab