import { useEffect, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { useBoardinfo } from '@/api/BoardInfoProvider'
import { MspMessage, MspCommand } from '@/api/msp/msp'
import { AttitudeIndicator, HeadingIndicator } from 'react-typescript-flight-indicators'
import { Badge, Card, Col, ListGroup, Row } from 'react-bootstrap'
import { createQuaternion, Euler, Quaternion, radToDeg } from '@/api/spatial'
import { createAttitudeRequest, parseAttitudeResponse } from '@/api/esp'
import { parseArmingDisableFlags, SensorType, sensorPresent } from "@/api/board"
import TabView from './TabView'
import { DroneX } from '../model'
import { Preview3DModel } from '../widget'

const QUATERNION_INIT = createQuaternion(0, 0, 0, 1)
const EULER_INIT = { roll: 0, pitch: 0, yaw: 0 }

const StatusTab = () => {

  const { status, version, connected } = useBoardinfo()
  const [attitudeE, setAttitudeE] = useState<Euler>(EULER_INIT)
  const [attitudeQ, setAttitudeQ] = useState<Quaternion>(QUATERNION_INIT)
  const { subscribeMsp, writeMsp } = useMsp()

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => {
      writeMsp(createAttitudeRequest())
    }, 100);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected, writeMsp]);

  useEffect(() => {
    return subscribeMsp((msg: MspMessage) => {
      if (msg.isCmd(MspCommand.ESP_CMD_ATTITUDE)) {
        const [q, e] = parseAttitudeResponse(msg)
        setAttitudeQ(q)
        setAttitudeE(e)
      }
    })
  }, [subscribeMsp])

  const attitudeStr = `${radToDeg(attitudeE.roll).toFixed(1)}\u00b0 x ${radToDeg(attitudeE.pitch).toFixed(1)}\u00b0`
  const headingStr = `${radToDeg(attitudeE.yaw).toFixed(1)}\u00b0`

  const armingDisableFlags = parseArmingDisableFlags(status?.armingDisableFlags || 0)

  return <TabView title='Status' nosave>
    <Row>
      <Col>
        <Preview3DModel attitudeQ={attitudeQ}>
          <DroneX />
        </Preview3DModel>
      </Col>
    </Row>

    <Row>
      <Col md={6}>

        <Card className='mb-3'>
          <Card.Header>Instruments</Card.Header>
          <Card.Body>
            <Row>
              <Col xs={6} className='text-center'>
                <AttitudeIndicator roll={radToDeg(-attitudeE.roll)} pitch={radToDeg(-attitudeE.pitch)} showBox={false} size='160px' />
                <br />
                Attitude {attitudeStr}
              </Col>
              <Col xs={6} className='text-center'>
                <HeadingIndicator heading={radToDeg(attitudeE.yaw)} showBox={false} size='160px' />
                <br />
                Heading {headingStr}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Firmware</Card.Header>
          <Card.Body>
            {version ? `${version.fwVersion ?? ''} (${version.fwRevision ?? ''})` : 'Unknown (Not connected)'}
          </Card.Body>
        </Card>

      </Col>
      <Col md={6}>

        <Card className='mb-3'>
          <Card.Header>Pre-Flight Checks</Card.Header>
          <Card.Body>
            <ListGroup>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Arming Prevention</span>
                <span>{armingDisableFlags.length ? armingDisableFlags.map((name, k) => <Badge key={k} bg="danger" className="ms-1">{name}</Badge>) :
                  (connected ? <Badge bg="success">OK</Badge> : <Badge bg="danger">Not connected</Badge>)}</span>
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Gyro</span>
                {sensorPresent(status?.sensors, SensorType.GYRO) ? <Badge bg="success">OK</Badge> : <Badge bg="danger">Required</Badge>}
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Accelerometer</span>
                {sensorPresent(status?.sensors, SensorType.ACC) ? <Badge bg="success">OK</Badge> : <Badge bg="warning">No Stab</Badge>}
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>GPS</span>
                {sensorPresent(status?.sensors, SensorType.GPS) ? <Badge bg="success">OK</Badge> : <Badge bg="warning">No Nav</Badge>}
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Barometer</span>
                {sensorPresent(status?.sensors, SensorType.BARO) ? <Badge bg="success">OK</Badge> : <Badge bg="info">Optional</Badge>}
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Compass</span>
                {sensorPresent(status?.sensors, SensorType.MAG) ? <Badge bg="success">OK</Badge> : <Badge bg="info">Optional</Badge>}
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>

      </Col>
    </Row>

  </TabView>
}

export default StatusTab