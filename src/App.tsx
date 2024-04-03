import './App.css'

function App() {

  const openPort = async () => {
    // Prompt user to select any serial port.
    const port = await navigator.serial.requestPort()
  }

  return (
    <>
      <h1>ESP-FC UI</h1>
      <button onClick={openPort}>Open Port</button>
    </>
  )
}

export default App
