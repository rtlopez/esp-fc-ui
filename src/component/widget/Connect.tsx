import Button from 'react-bootstrap/Button'
import { useSerial } from '@/api/serial/SerialProvider'

// https://gist.github.com/joshpensky/426d758c5779ac641d1d09f9f5894153

const Connect = () => {
  const { portState, connect, disconnect } = useSerial()

  if (portState === 'open') {
    return <Button onClick={disconnect} variant="danger"><i className='bi bi-arrow-left-right'></i> Disconnect</Button>
  } else if (portState === 'closed') {
    return <Button onClick={connect}><i className='bi bi-arrow-left-right'></i> Connect</Button>
  } else {
    return <span>{portState}...</span>
  }
}

export default Connect