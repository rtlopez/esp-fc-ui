import { useEffect, useState } from 'react'
import { useSerial } from '@/api/serial/SerialProvider'
import { useMsp } from '@/api/msp/MspProvider'
import { MspMessage, MspCommand } from '@/api/msp/msp'
import { AttitudeIndicator, HeadingIndicator } from 'react-typescript-flight-indicators'
import { Badge, Card, Col, ListGroup, Row } from 'react-bootstrap'
import { createQuaternion, Euler, Quaternion, radToDeg } from '@/api/spatial'
import { createAttitudeRequest, parseAttitudeResponse } from '@/api/esp'
import TabView from './TabView'
import { DroneX } from '../model'
import { Preview3DModel } from '../widget'

const QUATERNION_INIT = createQuaternion(0, 0, 0, 1)

const StatusTab = () => {

  const [attitudeE, setAttitudeE] = useState<Euler>({ roll: 0, pitch: 0, yaw: 0 })
  const [attitudeQ, setAttitudeQ] = useState<Quaternion>(QUATERNION_INIT)
  const { connected } = useSerial()
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
        <Card>
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