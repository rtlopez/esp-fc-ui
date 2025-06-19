import { useState } from "react"
import { Col, Container, Nav, Navbar, Row } from "react-bootstrap"
import Connection from "./Connection"
import Tester from "./Tester"
import { InputTab, HardwareTab, StatusTab, TuningTab } from "./tab"
import { useSerial } from "@/api/serial/SerialProvider"

const Layout = () => {

  const [ tab, setTab ] = useState<string|null>("status")
  const { portState } = useSerial()

  let tabComponent = null
  switch(tab) {
    case 'status':
      tabComponent = <StatusTab />
      break;
    case 'hardware':
      tabComponent = <HardwareTab />
      break;
    case 'input':
      tabComponent = <InputTab />
      break;
    case 'tuning':
      tabComponent = <TuningTab />
      break;
    default:
      tabComponent = <Tester />
  }

  return (
    <>
      <Navbar expand="lg" bg="dark" data-bs-theme="dark">
        <Container>

          <Navbar.Brand>ESP-FC UI</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              <Nav.Item>
                <Connection />
              </Nav.Item>
            </Nav>
          </Navbar.Collapse>

        </Container>
      </Navbar>

      <Container>
        <Row>
          <Col md={2}>
            <Nav defaultActiveKey="status" className="flex-column" onSelect={(selected) => setTab(selected)}>
              <Nav.Link eventKey="status">Status</Nav.Link>
              <Nav.Link eventKey="hardware">Hardware</Nav.Link>
              <Nav.Link eventKey="input">Input</Nav.Link>
              <Nav.Link eventKey="output">Output</Nav.Link>
              <Nav.Link eventKey="tuning">Tuning</Nav.Link>
              <Nav.Link eventKey="cli">CLI</Nav.Link>
            </Nav>
          </Col>
          <Col md={10} className="my-3">
            {tabComponent}
          </Col>
        </Row>
      </Container>

      <Navbar expand="lg" bg="dark" data-bs-theme="dark" fixed="bottom">
        <Container>
          <Nav>
            <Nav.Item>
              <Nav.Link as="span">Connection: {portState}</Nav.Link>
            </Nav.Item>
          </Nav>
        </Container>
      </Navbar>

    </>    

  )
}

export default Layout
