import { Card, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'

const OutputTab = () => {

  return <TabView title='Status' nosave>
    <Row>

      <Col md={6}>
        <Card>
          <Card.Header>Mixer</Card.Header>
          <Card.Body>

            <Form.Group as={Row} controlId="mixerType" className="mb-3">
              <Form.Label as={Col}>
                Mixer Type
              </Form.Label>
              <Col sm={9}>
                <Form.Select>
                  <option value="1">Quad X</option>
                  <option value="2">Tricopter</option>
                  <option value="2">Custom</option>
                </Form.Select>
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
              <Col sm={9}>
                <Form.Select>
                  <option value="1">PWM</option>
                  <option value="2">DSHOT 300</option>
                </Form.Select>
              </Col>
            </Form.Group>

          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default OutputTab