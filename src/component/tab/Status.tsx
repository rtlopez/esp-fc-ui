import { useEffect, useState } from 'react'
import { useSerial } from '@/api/serial/SerialProvider'
import { useMsp } from '@/api/msp/MspProvider'
import { MspMessage, MspCommand } from '@/api/msp/msp'
import { AttitudeIndicator, HeadingIndicator } from 'react-typescript-flight-indicators'
import { Badge, Card, Col, ListGroup, Row } from 'react-bootstrap'
import TabView from './TabView'

const StatusTab = () => {
 
  const [ attitude, setAttitude ] = useState({roll: 0, pitch: 0, yaw: 0})
  const { portState } = useSerial()
  const { subscribeMsp, writeMsp } = useMsp()

  useEffect(() => {
    if(portState !== 'open') return;
    const interval = setInterval(() => {
      writeMsp(new MspMessage(MspCommand.MSP_ATTITUDE.value))
    }, 200);
    return () => {
      clearInterval(interval);
    };
  }, [portState, writeMsp]);

  useEffect(() => {
    if(portState !== 'open') return;
    return subscribeMsp((msg: MspMessage) => {
      const roll = msg.read16() * 0.1
      const pitch = msg.read16() * 0.1
      const yaw = msg.read16() * 1
      setAttitude({roll, pitch, yaw})
    })
  }, [portState, subscribeMsp])
  
  const attitudeStr = `${attitude.roll.toFixed(1)}\u00b0 x ${attitude.pitch.toFixed(1)}\u00b0`
  const headingStr = `${attitude.yaw.toFixed(1)}\u00b0`

  return <TabView title='Status' nosave>

      <Col md={6}>
        <Card>
          <Card.Header>Instruments</Card.Header>
          <Card.Body as={Row}>
            <Col md={6}>
              <AttitudeIndicator roll={-attitude.roll} pitch={-attitude.pitch} showBox={false}/><br/>
              Attitude {attitudeStr}<br/>
            </Col>
            <Col md={6}>
              <HeadingIndicator heading={attitude.yaw} showBox={false}/><br/>
              Heading {headingStr}
            </Col>
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

    </TabView>
}

export default StatusTab