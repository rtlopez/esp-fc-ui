import { useState } from 'react'
import { Accordion, Alert, Button, Card, Col, Form, ProgressBar, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'

const FlashTab = () => {

  const { connected } = useMsp()
  const [activeKey, setActiveKey] = useState('1')
  const goToStep = (step: string) => setActiveKey(step)

  if (connected) return <Alert variant='danger'>Please disconnect from the flight controller before flashing new firmware.</Alert>

  return <Form className='mb-5'>

    <Row className='mb-3 align-items-center'>
      <Col>
        <h3>Flash</h3>
      </Col>
    </Row>

    <Row>
      <Col>
        <Card>
          <Card.Header>Flash Firmware</Card.Header>
          <Card.Body>
            <Accordion activeKey={activeKey} alwaysOpen>
              <Accordion.Item eventKey="1">
                <Accordion.Header>Step 1: connect to board</Accordion.Header>
                <Accordion.Body>
                  <p>Connect board to your computer and click "Connect".</p>
                  <div className="d-flex justify-content-end">
                    <Button onClick={() => goToStep('2')}>Connect</Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="2">
                <Accordion.Header>Step 2: Choose firmware</Accordion.Header>
                <Accordion.Body>
                  <p>Choose firmware version and click "Next".</p>
                  <Form.Select className="mb-3">
                    <option>From File</option>
                    <option>Firmware v1.0.0</option>
                    <option>Firmware v1.1.0</option>
                    <option>Firmware v1.2.0</option>
                  </Form.Select>
                  <Form.Control type="file" className='mb-3'/>
                  <div className="d-flex justify-content-end">
                    <Button variant="secondary" className="me-2" onClick={() => goToStep('1')}>&laquo; Back</Button>
                    <Button onClick={() => goToStep('3')}>Next &raquo;</Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
              <Accordion.Item eventKey="3">
                <Accordion.Header>Step 3: Upload firmware</Accordion.Header>
                <Accordion.Body>
                  <p>To upload selected firmware click "Flash firmware".</p>
                  <p><i>Board type: ESP32, Firmware version: v1.0</i></p>
                  <p>Power cycle board after flashing</p>
                  <ProgressBar now={60} label="60%" className="mb-3"/>
                  <div className="d-flex justify-content-end mt-2">
                    <Button variant="secondary" className="me-2" onClick={() => goToStep('2')}>&laquo; Back</Button>
                    <Button variant="warning" className="me-2">Erase Flash</Button>
                    <Button variant="danger">Flash firmware</Button>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>

          </Card.Body>
          <Card.Footer className="text-danger">Warning: Flashing firmware will erase all data on the flight controller!</Card.Footer>
        </Card>
      </Col>
    </Row>

  </Form>
}

export default FlashTab