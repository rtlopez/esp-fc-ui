import { Nav } from "react-bootstrap"
import { Link, useLocation } from "wouter"

const menuItems = [
  { label: "Status", link: "/", icon: "bi-speedometer" },
  { label: "Configuration", link: "/configuration", icon: "bi-wrench" },
  { label: "Tuning", link: "/tuning", icon: "bi-sliders2-vertical" },
  { label: "Receiver", link: "/input", icon: "bi-controller" },
  { label: "Modes", link: "/modes", icon: "bi-toggles" },
  { label: "Mixer", link: "/mixer", icon: "bi-diagram-3" },
  { label: "Output", link: "/output", icon: "bi-ui-radios-grid" },
  { label: "Logging", link: "/logging", icon: "bi-sd-card" /* bi-voicemail*/ },
  { label: "Battery", link: "/battery", icon: "bi-battery-half" },
  { label: "Sensors", link: "/sensors", icon: "bi-activity" /* bi-phone-flip */ },
  { label: "Gps", link: "/gps", icon: "bi-pin-map" /* bi-phone-flip */ },
  { label: "Pinout", link: "/hardware", icon: "bi-cpu" },
  { label: "Cli", link: "/cli", icon: "bi-terminal" },
  //{ label: "VTX", link: "/vtx", icon: "bi-camera-video" /* bi-wifi */ },
]

const MainMenu = () => {
  const [location] = useLocation()
  const disabled = location === '/flash'
  return (
    <Nav
      as="ul"
      variant="pills"
      className="flex-column"
    >
      {menuItems.map((item, i) => {
        return <Nav.Item as="li" key={i}>
          <Nav.Link as={Link} to={item.link} active={location === item.link} disabled={disabled}>
            <i className={`bi ${item.icon} fs-5`}></i> <span className="ms-2">{item.label}</span>
          </Nav.Link>
        </Nav.Item>
      })}
    </Nav>
  )
}

export default MainMenu