import { useEffect, useState } from 'react'
import './App.css'
import SerialProvider, { useSerial } from './api/serial/SerialProvider'
import MspProvider, { useMsp } from './api/msp/MspProvider'
import { MspMessage, MspCommand } from "./api/msp/msp"


// https://gist.github.com/joshpensky/426d758c5779ac641d1d09f9f5894153

const Connection = () => {
  const [ cmd, setCmd ] = useState('version')
  const [ cmdResponse, setCmdResponse ] = useState('')
  const [ mspCode, setMspCode ] = useState(1)
  const [ mspResponse, setMspResponse ] = useState('')
  const { portState, connect, disconnect } = useSerial()
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

  const preStyle = {border: '1px solid #ccc', padding: '2px', margin: '2px'}

  if(portState === 'open') {
    return <>
      <button onClick={disconnect}>Disconnect</button>&nbsp;
      <button onClick={clear}>clear</button>
      <br/>
      <select onChange={(e) => setMspCode(parseInt(e.target.value, 10))} defaultValue={mspCode}>
        <option key={0} value={0}>Select</option>
        {Object
          .values(MspCommand)
          .map(({value, label}) => <option key={value} value={value}>{label}</option>)
        }
      </select>&nbsp;
      <button onClick={sendMsp}>Send Msp</button>
      <br/>
      <input type="text" onChange={(e) => setCmd(e.target.value)} value={cmd} />&nbsp;
      <button onClick={sendText}>Send Text</button>
      <hr/>
      <pre style={preStyle}>{cmdResponse}</pre>
      <br/>
      <pre style={preStyle}>{mspResponse}</pre>
    </>
  } else if(portState === 'closed') {
    return <button onClick={connect}>Connect</button>
  } else {
    return <span>{portState}</span>
  }
}

const App = () => {
  return (
    <SerialProvider>
      <MspProvider>
        <h1>ESP-FC UI</h1>
        <Connection />
      </MspProvider>
    </SerialProvider>
  )
}

export default App
