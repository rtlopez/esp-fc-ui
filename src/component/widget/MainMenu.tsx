import { Nav } from "react-bootstrap"
import { Link, useLocation } from "wouter"

const MainMenu = () => {
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
        <Nav.Link as={Link} to="/sensors" active={location === '/sensors'}>
          <i className="bi bi-phone-flip fs-5"></i> <span className="ms-2">Sensors</span>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/input" active={location === '/input'}>
          <i className="bi bi-controller fs-5"></i> <span className="ms-2">Input</span>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/output" active={location === '/output'}>
          <i className="bi bi-ui-radios-grid fs-5"></i> <span className="ms-2">Output</span>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link as={Link} to="/configuration" active={location === '/configuration'}>
          <i className="bi bi-sliders fs-5"></i> <span className="ms-2">Configuration</span>
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

export default MainMenu