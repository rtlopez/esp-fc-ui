import { useCallback, useState } from "react"
import { Col, Container, Offcanvas, Row } from "react-bootstrap"
import { BottomBar, TopBar, MainMenu } from "./widget"

type LayoutProps = React.PropsWithChildren

const Layout: React.FC<LayoutProps> = ({ children }) => {

  const [show, setShow] = useState(false);
  const menuClose = useCallback(() => setShow(false), [setShow]);
  const menuShow = useCallback(() => setShow(true), [setShow]);

  return (
    <>
      <TopBar menuShow={menuShow} />

      <Container fluid>
        <Row>

          {/* Sidebar (visible on lg+) */}
          <Col lg={2} className="d-none d-lg-block min-vh-100 p-3">
            <h5>Menu</h5>
            <hr/>
            <MainMenu />
          </Col>

          {/* Sidebar for small screens */}
          <Offcanvas show={show} onHide={menuClose} responsive="lg" className="d-lg-none">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Menu</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <hr/>
              <MainMenu />
            </Offcanvas.Body>
          </Offcanvas>

          {/* Main content area */}
          <Col md={10} className="my-3">
            {children}
          </Col>

        </Row>
      </Container>

      <BottomBar />
    </>
  )
}

export default Layout
