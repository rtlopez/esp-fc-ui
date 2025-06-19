import { useEffect, useState } from 'react'
import { useSerial } from '@/api/serial/SerialProvider'
import { useMsp } from '@/api/msp/MspProvider'
import { MspMessage, MspCommand } from '@/api/msp/msp'
import { AttitudeIndicator, HeadingIndicator } from 'react-typescript-flight-indicators'
import { Card, Col, Container, Row } from 'react-bootstrap'
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
          <Card.Header>Attitude {attitudeStr}</Card.Header>
          <Card.Body>
            <AttitudeIndicator roll={-attitude.roll} pitch={-attitude.pitch} showBox={false} size={'200px'} />
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <Card.Header>Heading {headingStr}</Card.Header>
          <Card.Body>
            <HeadingIndicator heading={attitude.yaw} showBox={false} size={'200px'} />
          </Card.Body>
        </Card>
      </Col>

    </TabView>
}

export default StatusTab