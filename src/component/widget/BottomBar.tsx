import { Container, Navbar } from "react-bootstrap"
import { useBoardInfo } from "@/api/BoardInfoProvider"

const BottomBar = () => {

  const { status, statistics, version, connected } = useBoardInfo()

  return <Navbar expand="lg" bg="secondary" fixed="bottom">
    <Container fluid>
      <Navbar.Text>
        {connected ? 'Connected' : 'Disconnected'} |&nbsp;
        {status?.gyroTimeUs || '-'}us |&nbsp;
        {statistics?.loopTimeUs || '-'}us |&nbsp;
        {statistics?.cpuLoad || '-'}%
      </Navbar.Text>
      <Navbar.Text>
        &copy; 2025 @rtlopez
      </Navbar.Text>
      <Navbar.Text>
        {version ? `FW: ${version.fwVersion ?? ''} (${version.fwRevision ?? ''})` : 'FW: N/A'}
      </Navbar.Text>
    </Container>
  </Navbar>
}

export default BottomBar
