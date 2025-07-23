import { useMsp } from "@/api/msp/MspProvider"
import { useSerial } from "@/api/serial/SerialProvider"
import { Container, Nav, Navbar } from "react-bootstrap"


const BottomBar = () => {
  const { portState } = useSerial()
  const { version } = useMsp()

  return <Navbar expand="lg" bg="secondary" fixed="bottom">
    <Container fluid>
      <Nav>
        <Nav.Item>
          <Nav.Link as="span">Connection: {portState}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link as="span">Version: {version?.fwVersion ?? ''}</Nav.Link>
        </Nav.Item>
      </Nav>
    </Container>
  </Navbar>
}

export default BottomBar
