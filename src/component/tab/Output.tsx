import { Card, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'

const OutputTab = () => {

  return <TabView title='Output'>
    <Row>

      <Col md={6}>
        <Card>
          <Card.Header>Mixer</Card.Header>
          <Card.Body>

            <Form.Group as={Row} controlId="mixerType" className="mb-3">
              <Form.Label as={Col}>
                Mixer Type
              </Form.Label>
              <Col sm={6}>
                <Form.Select>
                  <option value="1">Quad X</option>
                  <option value="2">Tricopter</option>
                  <option value="2">Custom</option>
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="motorReversed" className="mb-3">
              <Form.Label as={Col}>
                Motor Reversed
              </Form.Label>
              <Col sm={6}>
                <Form.Switch />
              </Col>
            </Form.Group>


          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <Card.Header>Motors</Card.Header>
          <Card.Body>

            <Form.Group as={Row} controlId="motorProtocol" className="mb-3">
              <Form.Label as={Col}>
                Motor Protocol
              </Form.Label>
              <Col sm={6}>
                <Form.Select>
                  <option value="1">PWM</option>
                  <option value="2">DSHOT 300</option>
                </Form.Select>
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="dshotTelementry" className="mb-3">
              <Form.Label as={Col}>
                Dshot Telemetry
              </Form.Label>
              <Col sm={6}>
                <Form.Switch />
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="motorAsync" className="mb-3">
              <Form.Label as={Col}>
                Async Motor Output
              </Form.Label>
              <Col sm={6}>
                <Form.Switch />
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="motorOff" className="mb-3">
              <Form.Label as={Col}>Async Motor Update Rate</Form.Label>
              <Col sm={6}>
                <Form.Control type='number' min={50} max={8000} defaultValue={480} />
              </Col>
            </Form.Group>

            <Form.Group as={Row} controlId="motorOff" className="mb-3">
              <Form.Label as={Col}>Motor Disarmed Command</Form.Label>
              <Col sm={6}>
                <Form.Control type='number' min={990} max={2000} defaultValue={1000} />
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="motorMin" className="mb-3">
              <Form.Label as={Col}>Motor Min Command</Form.Label>
              <Col sm={6}>
                <Form.Control type='number' min={990} max={2000} defaultValue={1050} />
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="motorMax" className="mb-3">
              <Form.Label as={Col}>Motor Max Command</Form.Label>
              <Col sm={6}>
                <Form.Control type='number' min={990} max={2000} defaultValue={2000} />
              </Col>
            </Form.Group>

          </Card.Body>
        </Card>
      </Col>

    </Row>
    <Row>
      <Col>
        <Card className='mt-3'>
          <Card.Header>Motor Test (DANGER ZONE)</Card.Header>
          <Card.Body>
            <Form.Group as={Row} controlId="motorAsync" className="mb-3">
              <Col>
                <Form.Switch />
              </Col>
              <Form.Label as={Col} sm={10}>
                <strong>I Understand a Risk</strong>
              </Form.Label>
            </Form.Group>
            {[1, 2, 3, 4].map(motor => {
              return <Form.Group as={Row} controlId={`motor_${motor}`} key={motor} className="mb-3">
                <Form.Label as={Col}>{`M${motor}`}</Form.Label>
                <Col sm={10}>
                  <Form.Range min={0} max={100} step={1} defaultValue={0} />
                </Col>
              </Form.Group>
            })}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </TabView>
}

export default OutputTab