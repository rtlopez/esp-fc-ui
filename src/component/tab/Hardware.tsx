import { Card, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'

const HardwareTab = () => {

  return <TabView title='Hardware'>
    <Row>

      <Col lg={6}>
        <Card className='mb-3'>
          <Card.Header>Servos/Motors</Card.Header>
          <Card.Body>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((output) => {
              return <Form.Group key={output} as={Row} controlId={`output_${output}`} className="mb-3">
                <Form.Label as={Col} sm={3} className='text-right'>Output {output + 1}</Form.Label>
                <Col sm={9}>
                  <Form.Control type='number' min={-1} max={48} value={-1} readOnly />
                </Col>
              </Form.Group>
            })}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={6}>
        <Card className='mb-3'>
          <Card.Header>Serial Ports</Card.Header>
          <Card.Body>
            <Row className='mb-3'>
              <Col>Port</Col>
              <Col>Function</Col>
              <Col>Speed</Col>
              <Col>Rx Pin</Col>
              <Col>Tx Pin</Col>
            </Row>
            {[0, 1, 2, 3].map((port) => {
              return <Row>
                <Col>
                  UART{port + 1}
                </Col>
                <Form.Group key={port + 10} as={Col} controlId={`port_fn_${port}`} className="mb-3">
                  {/* <Form.Label sm={3}>Function</Form.Label> */}
                  <Form.Select>
                    <option value="0">Disabled</option>
                    <option value="1">Serial RX</option>
                    <option value="2">Msp</option>
                    <option value="3">GPS</option>
                    <option value="4">Telemetry</option>
                    <option value="5">Blackbox</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group key={port + 20} as={Col} controlId={`port_speed_${port}`} className="mb-3">
                  {/* <Form.Label sm={3}>Speed</Form.Label> */}
                  <Form.Select>
                    <option value="0">9 600</option>
                    <option value="1">19 200</option>
                    <option value="2">57 600</option>
                    <option value="3">115 200</option>
                    <option value="4">230 400</option>
                    <option value="5">250 000</option>
                    <option value="6">460 800</option>
                    <option value="7">500 000</option>
                    <option value="8">921 600</option>
                    <option value="9">1 000 000</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group key={port + 30} as={Col} controlId={`port_rx_${port}`} className="mb-3">
                  {/* <Form.Label sm={3}>RX Pin</Form.Label> */}
                  <Form.Control type='number' min={-1} max={48} value={-1} readOnly />
                </Form.Group>
                <Form.Group key={port + 40} as={Col} controlId={`port_tx_${port}`} className="mb-3">
                  {/* <Form.Label sm={3}>TX Pin</Form.Label> */}
                  <Form.Control type='number' min={-1} max={48} value={-1} readOnly />
                </Form.Group>
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default HardwareTab
