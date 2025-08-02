import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react"
import { useSerial } from "./serial/SerialProvider"
import { useMsp } from "./msp/MspProvider"
import { MspCommand, MspMessage } from "./msp/msp"
import {
  createDisableArmRequest, createStatisticsRequest, createStatusRequest, createVersionRequest,
  EspStatisticsResponse, EspStatusResponse, EspVersionResponse,
  parseStatisticsResponse, parseStatusResponse, parseVersionResponse
} from "./esp"

export interface BoardInfoContextValue {
  version: EspVersionResponse | null
  status: EspStatusResponse | null
  statistics: EspStatisticsResponse | null
  connected: boolean
}

const BoardInfoContext = createContext<BoardInfoContextValue>({
  version: null,
  status: null,
  statistics: null,
  connected: false,
});

type BoardInfoProviderProps = PropsWithChildren & {}

const BoardInfoProvider = ({
  children,
}: BoardInfoProviderProps) => {

  const { connected } = useSerial()
  const { cliActive, subscribeMsp, writeMsp } = useMsp()
  const [version, setVersion] = useState<EspVersionResponse | null>(null)
  const [status, setStatus] = useState<EspStatusResponse | null>(null)
  const [statistics, setStatistics] = useState<EspStatisticsResponse | null>(null)
  const versionPending = useRef(false)

  useEffect(() => {
    return subscribeMsp((msg: MspMessage) => {
      if (msg.isCmd(MspCommand.ESP_CMD_VERSION)) {
        setVersion(parseVersionResponse(msg))
        versionPending.current = false
        writeMsp(createDisableArmRequest({ type: 1 }))
      }
      if (msg.isCmd(MspCommand.ESP_CMD_STATISTICS)) {
        setStatistics(parseStatisticsResponse(msg))
      }
      if (msg.isCmd(MspCommand.ESP_CMD_STATUS)) {
        setStatus(parseStatusResponse(msg))
      }
      if (msg.isCmd(MspCommand.ESP_CMD_REBOOT)) {
        // Reboot command received, wait for board initialization and reset version and status to trigger a new version request
        setTimeout(() => {
          setStatus(null)
          setStatistics(null)
          setVersion(null) // useEffect below should trigger a new version request
        }, 500)
      }
    })
  })

  useEffect(() => {
    if (connected && version === null) {
      if (versionPending.current === false) { // avoid multiple calls
        versionPending.current = true
        writeMsp(createVersionRequest())
      }
    } else if (!connected && version !== null) {
      setVersion(null)
      setStatus(null)
      setStatistics(null)
    }
  }, [connected, version, writeMsp])

  useEffect(() => {
    const interval = setInterval(() => {
      if (connected && !cliActive) {
        writeMsp(createStatusRequest())
        writeMsp(createStatisticsRequest())
      }
    }, 350);
    return () => clearInterval(interval)
  }, [connected, cliActive, writeMsp]);

  return (
    <BoardInfoContext.Provider
      value={{
        version,
        status,
        statistics,
        connected,
      }}
    >
      {children}
    </BoardInfoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBoardinfo = () => useContext(BoardInfoContext)

export default BoardInfoProvider