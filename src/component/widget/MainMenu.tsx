import { Nav } from "react-bootstrap"
import { Link, useLocation } from "wouter"

const menuItems = [
  { label: "Status", link: "/", icon: "bi-speedometer" },
  { label: "Hardware", link: "/hardware", icon: "bi-cpu" },
  { label: "Sensors", link: "/sensors", icon: "bi-activity" /* bi-phone-flip */ },
  { label: "Configuration", link: "/configuration", icon: "bi-wrench" },
  { label: "Input", link: "/input", icon: "bi-controller" },
  { label: "Output", link: "/output", icon: "bi-ui-radios-grid" },
  { label: "Mixer", link: "/mixer", icon: "bi-diagram-3" },
  { label: "Tuning", link: "/tuning", icon: "bi-sliders2-vertical" },
  { label: "Modes", link: "/modes", icon: "bi-toggles" },
  { label: "Battery", link: "/battery", icon: "bi-battery-half" },
  { label: "VTX", link: "/vtx", icon: "bi-camera-video" /* bi-wifi */ },
  { label: "Logging", link: "/logging", icon: "bi-sd-card" /* bi-voicemail*/ },
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