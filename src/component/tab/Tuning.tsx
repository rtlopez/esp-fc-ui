import { Col, Container, Row, Form } from 'react-bootstrap'

const TuningTab = () => {

  return <Container>
    <Row>
      <h1>Tuning</h1>
    </Row>
    <Row>

      <Col md={6}>
        <Form>
          <Row key={'h'} className="mb-2">
            {['P', 'I', 'D', 'F'].map(col => (
              <Col key={col} textAlign="center">
                {col}
              </Col>
            ))}
          </Row>
          {['Roll', 'Pitch', 'Yaw'].map(row => (
            <Row key={row} className="mb-2">
              {['p', 'i', 'd', 'f'].map(col => (
                <Col key={col}>
                  <Form.Control type="number" name={`${row}-${col}`} min={0} max={255} value={88} defaultValue={80} />
                </Col>
              ))}
            </Row>
          ))}
          <Row>
            <Form.Group as={Col} controlId="masterGain" className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Label>Master Gain</Form.Label>
                <span style={{ fontWeight: 'bold' }}>0</span>
              </div>
              <Form.Range min={0} max={100} step={5}/>
            </Form.Group>
          </Row>
        </Form>
      </Col>
      <Col md={6}>

      </Col>

    </Row>
  </Container>
}

export default TuningTab