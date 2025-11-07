import { Container, Navbar } from "react-bootstrap"
import { useBoardInfo } from "@/api/BoardInfoProvider"

const BottomBar = () => {

  const { status, statistics, version, connected } = useBoardInfo()

  const uiVersion = import.meta.env.VITE_APP_VERSION || import.meta.env.VITE_PKG_VERSION  || "dev";
  const uiRevision = import.meta.env.VITE_APP_REVISION?.slice(0, 7) || "local";

  return <Navbar expand="lg" bg="secondary" fixed="bottom" className="pb-0 pt-0">
    <Container fluid>
      <Navbar.Text className="pt-1 pb-1">
        {connected ? 'Connected' : 'Disconnected'} |&nbsp;
        {status?.gyroTimeUs || '-'}us |&nbsp;
        {statistics?.loopTimeUs || '-'}us |&nbsp;
        {statistics?.cpuLoad || '-'}%
      </Navbar.Text>
      <Navbar.Text className="pt-1 pb-1">
        &copy; 2025 @rtlopez
      </Navbar.Text>
      <Navbar.Text className="pt-1 pb-1">
        {version ? `FW: ${version.fwVersion ?? ''} (${version.fwRevision ?? ''})` : 'FW: N/A'} / {uiVersion} {uiRevision}
      </Navbar.Text>
    </Container>
  </Navbar>
}

export default BottomBar
