import { useState } from 'react'
import { Card, Col, Row, Form } from 'react-bootstrap'
import TabView from './TabView'

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
  const [rollRate, setRollRate] = useState(240)
  const [pitchRate, setPitchRate] = useState(240)
  const [yawRate, setYawRate] = useState(320)

  return <TabView title='Input'>
    <Row>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>Tunnig</Card.Header>
          <Card.Body>
            <Row>
              <Form.Group as={Col} controlId="rollPitchGain" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll Pitch Gain
                  <span>{rollPitchGain}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} value={rollPitchGain} onChange={(e) => {
                  setRollPitchGain(+e.target.value)
                }} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="yawGain"value={yawGain} className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Yaw Gain
                  <span>{yawGain}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} onChange={(e) => {
                  setYawGain(+e.target.value)
                }} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="stability" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Stability
                  <span>{stability}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} value={stability} onChange={(e) => {
                  setStability(+e.target.value)
                }} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="smoothness" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Smoothness
                  <span>{smoothness}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} value={smoothness} onChange={(e) => {
                  setSmoothness(+e.target.value)
                }} />
              </Form.Group>
            </Row>
          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Rates</Card.Header>
          <Card.Body>
            <Row>
              <Form.Group as={Col} controlId="rollRate" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll Rate
                  <span>{rollRate} deg/s</span>
                </Form.Label>
                <Form.Range min={30} max={1800} step={10} value={rollRate} onChange={(e) => {
                  setRollRate(+e.target.value)
                }} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="pitchRate" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Pitch Rate
                  <span>{pitchRate} deg/s</span>
                </Form.Label>
                <Form.Range min={30} max={1800} step={10} value={[pitchRate]} onChange={(e) => {
                  setPitchRate(+e.target.value)
                }} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="yawRate" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Yaw Rate
                  <span>{yawRate} deg/s</span>
                </Form.Label>
                <Form.Range min={30} max={1800} step={10} value={yawRate} onChange={(e) => {
                  setYawRate(+e.target.value)
                }} />
              </Form.Group>
            </Row>
          </Card.Body>
        </Card>

      </Col>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>PIDS</Card.Header>
          <Card.Body>
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
                    }} />
                  </Col>
                ))}
              </Row>
            ))}
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default TuningTab