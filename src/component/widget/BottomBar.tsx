import { useEffect, useState } from "react"
import { MspCommand } from "@/api/msp/msp"
import { useMsp } from "@/api/msp/MspProvider"
import { Container, Navbar } from "react-bootstrap"
import {
  createStatisticsRequest, createStatusRequest, EspStatisticsResponse,
  EspStatusResponse, parseStatisticsResponse, parseStatusResponse
} from "@/api/esp"

const parseSensors = (sensors: number) => {
  let flags = '';
  if (sensors & 0x01) flags += 'G'
  if (sensors & 0x02) flags += 'A'
  if (sensors & 0x04) flags += 'B'
  if (sensors & 0x08) flags += 'M'
  if (sensors & 0x10) flags += 'N'
  return flags || '-'
}
const armingDisableFlags: Record<number, string> = {
  0: 'NO_GYRO',
  1: 'FAILSAFE',
  2: 'RX_FAILSAFE',
  3: 'BAD_RX_RECOVERY',
  4: 'BOXFAILSAFE',
  5: 'RUNAWAY_TAKEOFF',
  6: 'CRASH_DETECTED',
  7: 'THROTTLE',
  8: 'ANGLE',
  9: 'BOOT_GRACE_TIME',
  10: 'NOPREARM',
  11: 'LOAD',
  12: 'CALIBRATING',
  13: 'CLI',
  14: 'CMS_MENU',
  15: 'BST',
  16: 'MSP',
  17: 'PARALYZE',
  18: 'GPS',
  19: 'RESC',
  20: 'RPMFILTER',
  21: 'REBOOT_REQUIRED',
  22: 'DSHOT_BITBANG',
  23: 'ACC_CALIBRATION',
  24: 'MOTOR_PROTOCOL',
  25: 'ARM_SWITCH', // Needs to be the last element, since it's always activated if one of the others is active when arming
};

const parseArmingDisableFlags = (flags: number): string => {
  const result = []
  for (let i = 0; i < 25; i++) {
    if(flags & (1 << i)) result.push(armingDisableFlags[i])
  }
  return result.join(',')
}

const BottomBar = () => {
  const { version, connected, writeMsp, subscribeMsp, cliActive } = useMsp()
  const [statistics, setStatistics] = useState<EspStatisticsResponse>({
    uptimeMs: 0,
    loopTimeUs: 0,
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
        {connected ? 'Connected' : 'Disconnected'} |
        Sampling[us]: {status.gyroTimeUs || '-'} |
        Loop[us]: {statistics.loopTimeUs || '-'} |
        Cpu[%]: {statistics.cpuLoad || '-'} |
        Sensors: {parseSensors(status.sensors)} |
        Arming prevention: {parseArmingDisableFlags(status.armingDisableFlags)}
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
