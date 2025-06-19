import './App.css'
import SerialProvider from '@/api/serial/SerialProvider'
import MspProvider from '@/api/msp/MspProvider'
import Layout from '@/component/Layout'

const App = () => {
  return (
    <SerialProvider>
      <MspProvider>
        <Layout/>
      </MspProvider>
    </SerialProvider>
  )
}

export default App
