import { Button, Container, Navbar, Toast, ToastContainer } from "react-bootstrap"
import { useBoardinfo } from "@/api/BoardInfoProvider"
import Connect from "./Connect"
import Flash from "./Flash"
import { Link } from "wouter"

type TopBarProps = {
  menuShow: () => void
}

const TopBar: React.FC<TopBarProps> = ({ menuShow }) => {

  const { error, clearError } = useBoardinfo()

  return <>
    <Navbar expand="lg" bg="secondary">
      <Container fluid>

        <Button variant="outline-light" className="me-2 d-lg-none" onClick={menuShow}>
          <i className="bi bi-list" />
        </Button>
        <Navbar.Brand as={Link} to="/" className="h1"><i className="bi bi-radar"></i> ESP-FC UI</Navbar.Brand>
        <span>
          <Flash />
          <Connect />
        </span>

      </Container>
    </Navbar>
    <ToastContainer
      className="p-3"
      position="top-center"
      style={{ zIndex: 1 }}
    >
      <Toast show={!!error} onClose={clearError} delay={10000} autohide>
        <Toast.Header>
          Error
        </Toast.Header>
        <Toast.Body>
          {error}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  </>
}

export default TopBar