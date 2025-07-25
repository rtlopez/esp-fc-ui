import { useMsp } from "@/api/msp/MspProvider"
import { useSerial } from "@/api/serial/SerialProvider"
import { Container, Navbar } from "react-bootstrap"

const BottomBar = () => {
  const { portState } = useSerial()
  const { version } = useMsp()

  return <Navbar expand="lg" bg="secondary" fixed="bottom">
    <Container fluid>
      <Navbar.Text>
        Connection: {portState}
      </Navbar.Text>
      <Navbar.Text>
        &copy; 2025 @rtlopez
      </Navbar.Text>
      <Navbar.Text>
        Version: {version?.fwVersion ?? ''}
      </Navbar.Text>
    </Container>
  </Navbar>
}

export default BottomBar
