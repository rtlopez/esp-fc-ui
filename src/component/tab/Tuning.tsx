import { useState } from 'react'
import { Col, Container, Row, Form } from 'react-bootstrap'

type AxisNamesType = "roll" | "pitch" | "yaw"
type PidNamesType = "p" | "i" | "d" | "f"

const AxisNames: AxisNamesType[] = ['roll', 'pitch', 'yaw']
const PidNames: PidNamesType[] = ['p', 'i', 'd', 'f']

const TuningTab = () => {

  const [rollPitchGain, setRollPitchGain] = useState(100)
  const [yawGain, setYawGain] = useState(100)
  const [smoothness, setSmoothness] = useState(100)
  const [stability, setStability] = useState(100)
  const [pidValues, setPidValues] = useState({
    roll: { p: 80, i: 80, d: 80, f: 80 },
    pitch: { p: 80, i: 80, d: 80, f: 80 },
    yaw: { p: 80, i: 80, d: 80, f: 80 }
  })

  return <Container>
    <Row>
      <h1>Tuning</h1>
    </Row>
    <Row>

      <Col md={6}>
        <Form>

          <Row>
            <Form.Group as={Col} controlId="rollPitchGain" className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Label>Roll Pitch Gain</Form.Label>
                <span style={{ fontWeight: 'bold' }}>{rollPitchGain}%</span>
              </div>
              <Form.Range min={0} max={200} step={10} onChange={(e) => {
                setRollPitchGain(+e.target.value)
              }}/>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group as={Col} controlId="yawGain" className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Label>Yaw Gain</Form.Label>
                <span style={{ fontWeight: 'bold' }}>{yawGain}%</span>
              </div>
              <Form.Range min={0} max={200} step={10} onChange={(e) => {
                setYawGain(+e.target.value)
              }} />
            </Form.Group>
          </Row>

          <Row>
            <Form.Group as={Col} controlId="stability" className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Label>Stability</Form.Label>
                <span style={{ fontWeight: 'bold' }}>{stability}%</span>
              </div>
              <Form.Range min={0} max={200} step={10} onChange={(e) => {
                setStability(+e.target.value)
              }}/>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group as={Col} controlId="smoothness" className="mb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Form.Label>Smoothness</Form.Label>
                <span style={{ fontWeight: 'bold' }}>{smoothness}%</span>
              </div>
              <Form.Range min={0} max={200} step={10} onChange={(e) => {
                setSmoothness(+e.target.value)
              }}/>
            </Form.Group>
          </Row>

          <Row key={'h'} className="mb-2">
            {['Axis', 'P', 'I', 'D', 'F'].map(col => (
              <Col key={col} className="text-center">
                <strong>{col}</strong>
              </Col>
            ))}
          </Row>

          {AxisNames.map(row => (
            <Row key={row} className="mb-2">
              <Col key={'label'}>
                {row.charAt(0).toUpperCase() + row.slice(1)}
              </Col>
              {PidNames.map(col => (
                <Col key={col}>
                  <Form.Control type="number" name={`${row}-${col}`} min={0} max={255} value={pidValues[row][col]} onChange={(e) => {
                    setPidValues(prev => ({
                      ...prev,
                      [row]: {
                        ...prev[row],
                        [col]: +e.target.value
                      }
                    }))
                  }}/>
                </Col>
              ))}
            </Row>
          ))}
        </Form>
      </Col>
      <Col md={6}>

      </Col>

    </Row>
  </Container>
}

export default TuningTab