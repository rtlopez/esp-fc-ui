import { useSerial } from "@/api/serial/SerialProvider"
import { Container, Nav, Navbar } from "react-bootstrap"


const BottomBar = () => {
  const { portState } = useSerial()

  return <Navbar expand="lg" bg="dark" data-bs-theme="dark" fixed="bottom">
    <Container fluid>
      <Nav>
        <Nav.Item>
          <Nav.Link as="span">Connection: {portState}</Nav.Link>
        </Nav.Item>
      </Nav>
    </Container>
  </Navbar>
}

export default BottomBar
