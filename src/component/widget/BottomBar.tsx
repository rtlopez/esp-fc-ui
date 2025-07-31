import { useEffect, useState } from "react"
import { MspCommand } from "@/api/msp/msp"
import { useMsp } from "@/api/msp/MspProvider"
import { useSerial } from "@/api/serial/SerialProvider"
import { Container, Navbar } from "react-bootstrap"
import {
  createStatisticsRequest, createStatusRequest, EspStatisticsResponse,
  EspStatusResponse, parseStatisticsResponse, parseStatusResponse
} from "@/api/esp"

const BottomBar = () => {
  const { portState } = useSerial()
  const { version, connected, writeMsp, subscribeMsp, cliActive } = useMsp()
  const [statistics, setStatistics] = useState<EspStatisticsResponse>({
    uptimeMs: 0,
    cpuLoad: 0,
    cpu0Load: 0,
    cpu1Load: 0,
    heapFree: 0,
    heapTotal: 0,
    flashTotal: 0,
    flashUsed: 0,
  })
  const [status, setStatus] = useState<EspStatusResponse>({
    sensors: 0,
    gyroTimeUs: 0,
    modeSwitchMask: 0,
    modeActiveMask: 0,
    armingDisableFlags: 0,
  })

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_STATISTICS)) {
        setStatistics(parseStatisticsResponse(msg))
      }
      if (msg.isCmd(MspCommand.ESP_CMD_STATUS)) {
        setStatus(parseStatusResponse(msg))
      }
    })
  }, [subscribeMsp])

  useEffect(() => {
    const interval = setInterval(() => {
      if (connected && !cliActive) {
        writeMsp(createStatusRequest())
        writeMsp(createStatisticsRequest())
      }
    }, 300);
    return () => clearInterval(interval)
  }, [connected, cliActive, writeMsp]);

  return <Navbar expand="lg" bg="secondary" fixed="bottom">
    <Container fluid>
      <Navbar.Text>
        Connection: {portState} / Interval: {status.gyroTimeUs}us / Cpu Usage: {statistics.cpuLoad.toFixed(0)}%
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
