import { useEffect, useRef, useState } from 'react'
import { useSerial } from '@/api/serial/SerialProvider'
import { useMsp } from '@/api/msp/MspProvider'
import { MspMessage, MspCommand, MspVariant } from "@/api/msp/msp"
import { Button, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'

const TesterTab = () => {

  const [cmd, setCmd] = useState('version')
  const [cmdResponse, setCmdResponse] = useState('')
  const [mspCode, setMspCode] = useState(1)
  const [mspVariant, setMspVariant] = useState<MspVariant>('E')

  const { connected } = useSerial()
  const { subscribeMsp, writeMsp, subscribeText, writeText } = useMsp()

  useEffect(() => {
    return subscribeText((message) => {
      //console.log(message)
      setCmdResponse((old) => old + message)
    })
  })

  useEffect(() => {
    return subscribeMsp((msg: MspMessage) => {
      //console.log(msg)
      setCmdResponse((old) => old + msg.toString() + '\n')
    })
  })

  const sendText = () => {
    //console.log(["sendText", cmd])
    writeText(cmd)
    setCmd('')
  }

  const sendMsp = () => {
    //console.log(["sendMsp", mspCode, mspVariant])
    const msg = new MspMessage(mspCode, mspVariant)
    setCmdResponse((old) => old + msg.toString() + '\n')
    writeMsp(msg)
  }

  const clear = () => {
    setCmdResponse('')
    setCmd('version')
  }

  const preStyle = { border: '1px solid #ccc', padding: '2px', margin: '2px', minHeight: '400px', maxHeight: '400px' }
  const preRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [cmdResponse]);

  return <TabView title="Tester" nosave>
    <Row>
      <Col xl={5} xs={9} className='mb-2'>
        <Form.Control
          type="text"
          onChange={(e) => setCmd(e.target.value)}
          value={cmd}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendText()
            }
          }}
        />
      </Col>
      <Col xl={1} xs={3}>
        <Button onClick={sendText} disabled={!connected}>Send</Button>
      </Col>
      <Col xl={1} xs={4}>
        <Form.Group controlId='mspVariant'>
          <Form.Select onChange={(e) => setMspVariant(e.target.value as MspVariant)} defaultValue={mspVariant}>
            <option value="E">ESP</option>
            <option value="M">MSP</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col xl={3} xs={4}>
        <Form.Select onChange={(e) => setMspCode(+e.target.value)} defaultValue={mspCode}>
          <option key={0} value={0}>Select</option>
          {(Object
            .values(MspCommand)
            .filter((c) => c.variant! === mspVariant))
            .map(({ value, label, variant }) => <option key={variant + value} value={value}>{`${label}(${value})`}</option>)
          }
        </Form.Select>
      </Col>
      <Col xl={2} xs={4}>
        <Button onClick={sendMsp} disabled={!connected}>Send</Button>
        <Button onClick={clear} className='ms-2'>Clear</Button>
      </Col>
    </Row>
    <hr />
    <pre style={preStyle} ref={preRef}>
      {cmdResponse}
    </pre>
  </TabView>
}

export default TesterTab