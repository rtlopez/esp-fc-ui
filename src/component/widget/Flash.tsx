import Button from 'react-bootstrap/Button'
import { useMsp } from '@/api/msp/MspProvider'
import { Link } from 'wouter'

const Flash = () => {
  const { connected } = useMsp()
  if (connected) return null
  return <Link to="/flash" className="text-decoration-none">
    <Button variant="outline-warning" className='me-2'><i className='bi bi-upload me-1'></i> Flash</Button>
  </Link>
}

export default Flash