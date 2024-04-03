import { useEffect, useState } from 'react'
import './App.css'
import SerialProvider, { useSerial } from './api/serial/SerialProvider'

// https://gist.github.com/joshpensky/426d758c5779ac641d1d09f9f5894153

const Connection = () => {
  const { portState, connect, disconnect, subscribe, write } = useSerial()
  const [ cmd, setCmd ] = useState('')

  useEffect(() => {
    return subscribe((message) => {
      console.log(message.value)
    })
  })

  const send = () => {
    write(`${cmd}\n`)
  }

  if(portState === 'closed') {
    return <button onClick={connect}>Connect</button>
  } else if(portState === 'open') {
    return <>
      <button onClick={disconnect}>Disconnect</button>&nbsp;
      <input type="text" onChange={(e) => setCmd(e.target.value)} />&nbsp;
      <button onClick={send}>Send</button>
    </>
  } else {
    return <span>{portState}</span>
  }
}

const App = () => {
  return (
    <SerialProvider>
      <h1>ESP-FC UI</h1>
      <Connection />
    </SerialProvider>
  )
}

export default App
