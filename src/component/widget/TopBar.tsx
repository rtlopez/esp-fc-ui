import { Button, Container, Navbar } from "react-bootstrap"
import Connect from "./Connect"

type TopBarProps = {
  menuShow: () => void
}

const TopBar: React.FC<TopBarProps> = ({ menuShow }) => {

  return <Navbar expand="lg" bg="secondary">
    <Container fluid>

      <Button variant="outline-light" className="me-2 d-lg-none" onClick={menuShow}>
        <i className="bi bi-list" />
      </Button>
      <Navbar.Brand as="h1"><i className="bi bi-radar"></i> ESP-FC UI</Navbar.Brand>
      <Connect />

    </Container>
  </Navbar>
}

export default TopBar