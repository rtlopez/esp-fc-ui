import { useEffect, useState } from 'react'
import { useSerial } from '@/api/serial/SerialProvider'
import { useMsp } from '@/api/msp/MspProvider'
import { MspMessage, MspCommand, MspVariant } from "@/api/msp/msp"
import Button from 'react-bootstrap/Button'

const TesterTab = () => {

  const [cmd, setCmd] = useState('version')
  const [cmdResponse, setCmdResponse] = useState('')
  const [mspCode, setMspCode] = useState(1)
  const [mspVariant, setMspVariant] = useState<MspVariant>('E')
  const [mspResponse, setMspResponse] = useState('')

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
      setMspResponse((old) => old + msg.toString() + '\n')
    })
  })

  const sendText = () => {
    //console.log(["sendText", cmd])
    writeText(cmd)
  }

  const sendMsp = () => {
    //console.log(["sendMsp", mspCode])
    const msg = new MspMessage(mspCode, mspVariant)
    setMspResponse((old) => old + msg.toString() + '\n')
    writeMsp(msg)
  }

  const clear = () => {
    setCmdResponse('')
    setMspResponse('')
  }

  const preStyle = { border: '1px solid #ccc', padding: '2px', margin: '2px' }

  return <>
    <select onChange={(e) => setMspVariant(e.target.value as MspVariant)} defaultValue={mspVariant}>
      <option value="E">ESP</option>
      <option value="M">MSP</option>
    </select>&nbsp;
    <select onChange={(e) => setMspCode(+e.target.value)} defaultValue={mspCode}>
      <option key={0} value={0}>Select</option>
      {Object
        .values(MspCommand)
        .filter((c) => c.variant === mspVariant)
        .map(({ value, label }) => <option key={value} value={value}>{label}</option>)
      }
    </select>&nbsp;
    <Button onClick={sendMsp} disabled={!connected}>Send Msp</Button>
    <br />
    <input type="text" onChange={(e) => setCmd(e.target.value)} value={cmd} />&nbsp;
    <Button onClick={sendText} disabled={!connected}>Send Text</Button>
    <br />
    <Button onClick={clear}>clear</Button>
    <hr />
    <pre style={preStyle}>{cmdResponse}</pre>
    <br />
    <pre style={preStyle}>{mspResponse}</pre>
  </>
}

export default TesterTab