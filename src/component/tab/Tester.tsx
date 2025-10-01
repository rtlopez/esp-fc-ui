import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { MspMessage, MspCommand, MspVariant, mspCommandFromValue, MspCommandEntry } from "@/api/msp/msp"
import { Button, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'

const TesterTab = () => {

  const [cmd, setCmd] = useState('version')
  const [cmdResponse, setCmdResponse] = useState('')
  const [mspCode, setMspCode] = useState(1)
  const [mspVariant, setMspVariant] = useState<MspVariant>('E')

  const { connected, subscribeMsp, writeMsp, subscribeText, writeText, setCliActive } = useMsp()

  useEffect(() => {
    return subscribeText((message) => {
      //console.log(message)
      setCmdResponse((old) => old + message)
    })
  }, [subscribeText])

  useEffect(() => {
    setCliActive(true)
    return () => setCliActive(false)
  }, [setCliActive])

  useEffect(() => {
    return subscribeMsp((msg: MspMessage) => {
      //console.log(msg)
      setCmdResponse((old) => {
        const parser = mspCommandFromValue(msg.cmd, msg.variant)?.parse
        const parsed = parser ? JSON.stringify(parser(msg)) + '\n' : ''
        return old + msg.toString() + '\n' + parsed
      })
    })
  }, [subscribeMsp])

  const sendText = useCallback(() => {
    //console.log(["sendText", cmd])
    writeText(cmd)
    setCmd('')
  }, [writeText, cmd])

  const sendMsp = useCallback(() => {
    //console.log(["sendMsp", mspCode, mspVariant])
    const msg = new MspMessage(mspCode, mspVariant)
    setCmdResponse((old) => {
      return old + msg.toString() + '\n'
    })
    writeMsp(msg)
  }, [writeMsp, mspCode, mspVariant])

  const clear = useCallback(() => {
    setCmdResponse('')
    setCmd('version')
  }, [])

  const preStyle = {
    border: '1px solid var(--bs-border-color)',
    borderRadius: 'var(--bs-border-radius)',
    background: 'var(--bs-tertiary-bg)',
    color: 'var(--bs-tertiary-color)',
    padding: '2px', margin: '2px', minHeight: '550px', maxHeight: '550px'
  }
  const preRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [cmdResponse]);

  const handleKeyDownText = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendText()
    }
  }, [sendText])

  const handleChangeText = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCmd(e.target.value)
  }, [])

  return <TabView title="Tester" nosave>
    <Row>
      <Col xl={5} xs={9} className='mb-2'>
        <Form.Control type="text" onChange={handleChangeText} value={cmd} onKeyDown={handleKeyDownText} />
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
          {Object.entries(Object.values(MspCommand)
            .filter((c) => c.variant! === mspVariant)
            .reduce((groups: Record<string, MspCommandEntry[]>, command) => {
              const group = command.group || 'Other';
              groups[group] = [...(groups[group] || []), command];
              return groups;
            }, {}))
            .map(([group, commands]) => (
              <optgroup key={group} label={group}>
                {commands.map(({ value, label, variant }) => (
                  <option key={variant + value} value={value}>
                    {`${label} (0x${value.toString(16).toUpperCase().padStart(2, '0')})`}
                  </option>
                ))}
              </optgroup>
            ))}
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