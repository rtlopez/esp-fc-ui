import React, { useState } from "react"
import { Button, Col, Container, Nav, Navbar, Offcanvas, Row } from "react-bootstrap"
import Connection from "./Connection"
import Tester from "./Tester"
import { InputTab, HardwareTab, StatusTab, TuningTab } from "./tab"
import { useSerial } from "@/api/serial/SerialProvider"

type MainMenuProps = {
  tab: string | null
  setTab: (tab: string | null) => void
}

const MainMenu: React.FC<MainMenuProps> = ({ tab, setTab }) => {
  const expanded = true
  //const [ expanded, setExpanded ] = useState(false)

  return (
    <Nav
      variant="pills"
      className="flex-column"
      activeKey={tab!}
      onSelect={(selected) => setTab(selected)}
    >
      <Nav.Link eventKey="status" className="d-flex align-items-center px-2 py-3">
        <i className="bi bi-speedometer2 fs-5"></i> {expanded && <span className="ms-2">Status</span>}
      </Nav.Link>
      <Nav.Link eventKey="hardware" className="d-flex align-items-center px-2 py-3">
        <i className="bi bi-cpu fs-5"></i> {expanded && <span className="ms-2">Hardware</span>}
      </Nav.Link>
      <Nav.Link eventKey="input" className="d-flex align-items-center px-2 py-3">
        <i className="bi bi-joystick fs-5"></i> {expanded && <span className="ms-2">Input</span>}
      </Nav.Link>
      <Nav.Link eventKey="output" className="d-flex align-items-center px-2 py-3">
        <i className="bi bi-box-arrow-up-right fs-5"></i> {expanded && <span className="ms-2">Output</span>}
      </Nav.Link>
      <Nav.Link eventKey="tuning" className="d-flex align-items-center px-2 py-3">
        <i className="bi bi-sliders fs-5"></i> {expanded && <span className="ms-2">Tuning</span>}
      </Nav.Link>
      <Nav.Link eventKey="cli" className="d-flex align-items-center px-2 py-3">
        <i className="bi bi-terminal fs-5"></i> {expanded && <span className="ms-2">CLI</span>}
      </Nav.Link>
    </Nav>
  )
}

const Layout = () => {

  const [show, setShow] = useState(false);
  const menuClose = () => setShow(false);
  const menuShow = () => setShow(true);
  const [tab, setTab] = useState<string | null>("status")
  const { portState } = useSerial()

  let tabComponent = null
  switch (tab) {
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
        <Container fluid>

          <Button variant="outline-light" className="me-2 d-lg-none" onClick={menuShow}>
            <i className="bi bi-list" />
          </Button>
          <Navbar.Brand><i className="bi bi-radar"></i> ESP-FC UI</Navbar.Brand>
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

      <Container fluid>
        <Row>

          {/* Sidebar (visible on lg+) */}
          <Col lg={2} className="d-none d-lg-block bg-light min-vh-100 p-3">
            <h5>Menu</h5>
            <MainMenu tab={tab} setTab={setTab} />
          </Col>

          {/* Sidebar for small screens */}
          <Offcanvas show={show} onHide={menuClose} responsive="lg" className="d-lg-none">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <MainMenu tab={tab} setTab={setTab} />
            </Offcanvas.Body>
          </Offcanvas>

          {/* Main content area */}
          <Col md={10} className="my-3">
            {tabComponent}
          </Col>

        </Row>
      </Container>

      <Navbar expand="lg" bg="dark" data-bs-theme="dark" fixed="bottom">
        <Container fluid>
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
