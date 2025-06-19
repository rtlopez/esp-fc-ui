import { useEffect, useState } from 'react'
import { useSerial } from '@/api/serial/SerialProvider'
import { useMsp } from '@/api/msp/MspProvider'
import { MspMessage, MspCommand } from "@/api/msp/msp"
import Button from 'react-bootstrap/Button'

const Tester = () => {

  const [cmd, setCmd] = useState('version')
  const [cmdResponse, setCmdResponse] = useState('')
  const [mspCode, setMspCode] = useState(1)
  const [mspResponse, setMspResponse] = useState('')

  const { portState } = useSerial()
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
    writeMsp(new MspMessage(mspCode))
  }

  const clear = () => {
    setCmdResponse('')
    setMspResponse('')
  }

  const preStyle = { border: '1px solid #ccc', padding: '2px', margin: '2px' }

  if (portState === 'open') {
    return <>
      <select onChange={(e) => setMspCode(parseInt(e.target.value, 10))} defaultValue={mspCode}>
        <option key={0} value={0}>Select</option>
        {Object
          .values(MspCommand)
          .map(({ value, label }) => <option key={value} value={value}>{label}</option>)
        }
      </select>&nbsp;
      <Button onClick={sendMsp}>Send Msp</Button>
      <br />
      <input type="text" onChange={(e) => setCmd(e.target.value)} value={cmd} />&nbsp;
      <Button onClick={sendText}>Send Text</Button>
      <br/>
      <Button onClick={clear}>clear</Button>
      <hr />
      <pre style={preStyle}>{cmdResponse}</pre>
      <br />
      <pre style={preStyle}>{mspResponse}</pre>
    </>
  } else {
    return <>
      <span>Not connectd</span>
    </>
  }
}

export default Tester