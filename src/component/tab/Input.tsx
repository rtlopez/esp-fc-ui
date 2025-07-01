import { useEffect, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { createInputRequest, EspInputResponse, parseInputResponse } from '@/api/esp'
import { Card, Col, Form, ProgressBar, Row } from 'react-bootstrap'
import { RcControls } from '@/component/widget'
import TabView from './TabView'
import { MspCommand } from '@/api/msp/msp'

const channelMaping: Record<number, string> = {
  0: "Roll",
  1: "Pitch",
  2: "Yaw",
  3: "Throttle",
}

const inputTypes = [
  {id: 1, name: 'Serial - IBUS'},
  {id: 2, name: 'Serial - SBUS'},
  {id: 3, name: 'Serial - CRSF/ELRS'},
  {id: 10, name: 'Esp Now'},
  {id: 11, name: 'PPM'},
]

const InputTab = () => {

  const [inputs, setInputs] = useState<EspInputResponse>({ count: 8, channels: [1500, 1500, 1500, 1000, 1500, 1500, 1500, 1500] })
  const { connected, writeMsp, subscribeMsp } = useMsp()

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isA(MspCommand.ESP_CMD_INPUT)) {
        setInputs(parseInputResponse(msg))
      }
    })
  })

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => {
      writeMsp(createInputRequest())
    }, 300);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected, writeMsp]);

  return <TabView title='Input'>
    <Row>

      <Col lg={6}>
        <Card className="mb-2">
          <Card.Header>Options</Card.Header>
          <Card.Body>

            <Form.Group as={Row} className="mb-3" controlId="inputType">
              <Form.Label column>Receiver Type</Form.Label>
              <Col sm={6}>
                <Form.Select>
                  {inputTypes.map(({id, name}) => <option key={id} value={id}>{name}</option>)}
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="inputMin" className="mb-3">
              <Form.Label column>Minimum</Form.Label>
              <Col sm={6}>
                <Form.Control type="number" defaultValue={885} />
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="inputMid" className="mb-3">
              <Form.Label column>Center</Form.Label>
              <Col sm={6}>
                <Form.Control type="number" defaultValue={1500} />
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="inputMax" className="mb-3">
              <Form.Label column>Maximum</Form.Label>
              <Col sm={6}>
                <Form.Control type="number" defaultValue={2115} />
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="inputdeadband" className="mb-3">
              <Form.Label column>Deadband</Form.Label>
              <Col sm={6}>
                <Form.Control type="number" defaultValue={2} />
              </Col>
            </Form.Group>

          </Card.Body>
        </Card>
      </Col>

      <Col lg={6}>

        <Card className="mb-2">
          <Card.Header>Sticks</Card.Header>
          <Card.Body className='d-flex justify-content-between align-items-start'>
            <RcControls w={170} h={170} px={0} py={-1} pr={10} />
            <RcControls w={170} h={170} px={0} py={0} pr={10} />
          </Card.Body>
        </Card>

        <Card className="mb-2">
          <Card.Header>Channel Monitor</Card.Header>
          <Card.Body>
            {inputs.channels.map((ch, i) => {
              return <Row key={i}>
                <Col xs={2}>
                  {channelMaping[i] ? channelMaping[i] : `CH${i + 1}`}
                </Col>
                <Col xs={10}>
                  {i < inputs.count ? <ProgressBar key={i} now={ch} label={`${ch}`} min={880} max={2120} animated={false} /> : null}
                </Col>
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={6}>
      </Col>

    </Row>
  </TabView >
}

export default InputTab
