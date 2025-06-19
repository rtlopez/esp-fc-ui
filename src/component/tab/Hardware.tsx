import { Card, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'

const HardwareTab = () => {

  return <TabView title='Hardware'>
    <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>Outputs</Card.Header>
          <Card.Body>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((output) => {
              return <Form.Group key={output} as={Row} controlId={`output_${output}`} className="mb-3">
                <Form.Label as={Col} sm={3} className='text-right'>Output {output + 1}</Form.Label>
                <Col sm={9}>
                  <Form.Control type='number' min={-1} max={48} value={-1} />
                </Col>
              </Form.Group>
            })}
          </Card.Body>
        </Card>

    </Col>
    <Col md={6}>

      <Card className='mb-3'>
        <Card.Header>Serial Ports</Card.Header>
        <Card.Body>
          {[0, 1, 2, 3].map((port) => {
            return [<Form.Group key={port} as={Row} controlId={`port_rx_${port}`} className="mb-3">
              <Form.Label as={Col} sm={3} className='text-right'>Port {port + 1} RX</Form.Label>
              <Col sm={9}>
                <Form.Control type='number' min={-1} max={48} value={-1} />
              </Col>
            </Form.Group>,
            <Form.Group key={port} as={Row} controlId={`port_tx_${port}`} className="mb-3">
              <Form.Label as={Col} sm={3} className='text-right'>Port {port + 1} TX</Form.Label>
              <Col sm={9}>
                <Form.Control type='number' min={-1} max={48} value={-1} />
              </Col>
            </Form.Group>
            ]
          })}
        </Card.Body>
      </Card>

    </Col>
  </TabView>
}

export default HardwareTab
