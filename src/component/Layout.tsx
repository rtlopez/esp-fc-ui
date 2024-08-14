import { Col, Container, Nav, Navbar, Row } from "react-bootstrap"
import Connection from "./Connection"
import Tester from "./Tester"

const Layout = () => {

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
          <Col md={1}>
            <Nav defaultActiveKey="status" className="flex-column">
              <Nav.Link eventKey="status">Status</Nav.Link>
              <Nav.Link eventKey="Config">Config</Nav.Link>
              <Nav.Link eventKey="CLI">CLI</Nav.Link>
            </Nav>
          </Col>
          <Col md={11}>
            <Tester/>
          </Col>
        </Row>
      </Container>
    </>    

  )
}

export default Layout
