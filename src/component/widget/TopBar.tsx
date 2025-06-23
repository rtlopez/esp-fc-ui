import { Button, Container, Nav, Navbar } from "react-bootstrap"
import Connect from "./Connect"

type TopBarProps = {
  menuShow: () => void
}

const TopBar: React.FC<TopBarProps> = ({ menuShow }) => {

  return <Navbar expand="lg" bg="dark" data-bs-theme="dark">
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
}

export default TopBar