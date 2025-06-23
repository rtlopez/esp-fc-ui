import { useState } from "react"
import { Link, useLocation } from "wouter"
import { Button, Col, Container, Nav, Navbar, Offcanvas, Row } from "react-bootstrap"
import Connect from "./widget/Connect"
import { useSerial } from "@/api/serial/SerialProvider"

const MainMenuLinks = () => {
  const [ location ] = useLocation()
  return (
    <Nav
      as="ul"
      variant="pills"
      className="flex-column"
    >
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/" active={location === '/'}>
          <i className="bi bi-speedometer2 fs-5"></i> <span className="ms-2">Status</span>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/hardware" active={location === '/hardware'}>
          <i className="bi bi-cpu fs-5"></i> <span className="ms-2">Hardware</span>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/input" active={location === '/input'}>
          <i className="bi bi-joystick fs-5"></i> <span className="ms-2">Input</span>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/output" active={location === '/output'}>
          <i className="bi bi-box-arrow-up-right fs-5"></i> <span className="ms-2">Output</span>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/tuning" active={location === '/tuning'}>
          <i className="bi bi-sliders fs-5"></i> <span className="ms-2">Tuning</span>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/cli" active={location === '/cli'}>
          <i className="bi bi-terminal fs-5"></i> <span className="ms-2">CLI</span>
        </Nav.Link>
      </Nav.Item>
    </Nav>
  )
}


type LayoutProps = React.PropsWithChildren

const Layout: React.FC<LayoutProps> = ({ children }) => {

  const [show, setShow] = useState(false);
  const menuClose = () => setShow(false);
  const menuShow = () => setShow(true);
  const { portState } = useSerial()

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
                <Connect />
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
            <MainMenuLinks />
          </Col>

          {/* Sidebar for small screens */}
          <Offcanvas show={show} onHide={menuClose} responsive="lg" className="d-lg-none">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <MainMenuLinks />
            </Offcanvas.Body>
          </Offcanvas>

          {/* Main content area */}
          <Col md={10} className="my-3">
            {children}
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
