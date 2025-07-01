import Button from 'react-bootstrap/Button'
import { useSerial } from '@/api/serial/SerialProvider'
import { useMsp } from '@/api/msp/MspProvider'

const Connect = () => {
  const { portState } = useSerial()
  const { connect, disconnect } = useMsp()

  if (portState === 'open') {
    return <Button onClick={disconnect} variant="danger"><i className='bi bi-lightning'></i> Disconnect</Button>
  } else if (portState === 'closed') {
    return <Button onClick={connect}><i className='bi bi-plug'></i> Connect</Button>
  } else {
    return <span>{portState}...</span>
  }
}

export default Connect