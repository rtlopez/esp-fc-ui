import { Col, Container, Form, Row } from 'react-bootstrap'

const HardwareTab = () => {

return <Container>
    <Row>
      <Col>
        <h1>Hardware</h1>
      </Col>
    </Row>
    <Row>
      <Col md={6}>
        <Form>
          <Row>
            <h2>Output Pins</h2>
          </Row>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((output) => {
            return <Form.Group key={output} as={Row} controlId={`output_${output}`} className="mb-3">
              <Form.Label as={Col} sm={3} className='text-right'>Output {output + 1}</Form.Label>
              <Col sm={9}>
                <Form.Control type='number' min={-1} max={48} value={-1} />
              </Col>
            </Form.Group>
          })}
        </Form>
      </Col>
      <Col md={6}>
      </Col>
    </Row>
  </Container>
}

export default HardwareTab
