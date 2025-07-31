import { Nav } from "react-bootstrap"
import { Link, useLocation } from "wouter"

const menuItems = [
  { label: "Status", link: "/", icon: "bi-speedometer" },
  { label: "Hardware", link: "/hardware", icon: "bi-cpu" },
  { label: "Sensors", link: "/sensors", icon: "bi-phone-flip" },
  { label: "Configuration", link: "/configuration", icon: "bi-gear" },
  { label: "Input", link: "/input", icon: "bi-controller" },
  { label: "Output", link: "/output", icon: "bi-ui-radios-grid" },
  { label: "Tuning", link: "/tuning", icon: "bi-sliders" },
  { label: "Cli", link: "/cli", icon: "bi-terminal" },
]

const MainMenu = () => {
  const [location] = useLocation()
  return (
    <Nav
      as="ul"
      variant="pills"
      className="flex-column"
    >
      {menuItems.map((item, i) => {
        return <Nav.Item as="li" key={i}>
          <Nav.Link as={Link} to={item.link} active={location === item.link}>
            <i className={`bi ${item.icon} fs-5`}></i> <span className="ms-2">{item.label}</span>
          </Nav.Link>
        </Nav.Item>
      })}
    </Nav>
  )
}

export default MainMenu