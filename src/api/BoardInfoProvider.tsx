import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react"
import { useMsp } from "./msp/MspProvider"
import { MspCommand, MspMessage } from "./msp/msp"
import {
  createDisableArmRequest, createMspVersionRequest, createStatisticsRequest,
  createStatusRequest, createVersionRequest, EspStatisticsResponse,
  EspStatusResponse, EspVersionResponse, parseMspVersionResponse,
  parseStatisticsResponse, parseStatusResponse, parseVersionResponse
} from "./esp"

export interface BoardInfoContextValue {
  version: EspVersionResponse | null
  status: EspStatusResponse | null
  statistics: EspStatisticsResponse | null
  connected: boolean
  error: string | null
  clearError(): void
}

const BoardInfoContext = createContext<BoardInfoContextValue>({
  version: null,
  status: null,
  statistics: null,
  connected: false,
  error: null,
  clearError: () => { }
});

type BoardInfoProviderProps = PropsWithChildren & {}

const BoardInfoProvider = ({
  children,
}: BoardInfoProviderProps) => {

  const { connected, cliActive, subscribeMsp, writeMsp, disconnect } = useMsp()
  const [version, setVersion] = useState<EspVersionResponse | null>(null)
  const [status, setStatus] = useState<EspStatusResponse | null>(null)
  const [statistics, setStatistics] = useState<EspStatisticsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const versionPending = useRef(false)

  useEffect(() => {
    const close = async () => {
      await disconnect()
    }
    return subscribeMsp((msg: MspMessage) => {
      if (msg.isCmd(MspCommand.ESP_CMD_VERSION)) {
        setVersion(parseVersionResponse(msg))
        versionPending.current = false
        writeMsp(createDisableArmRequest({ type: 1 }))
      }
      if (msg.isCmd(MspCommand.MSP_API_VERSION)) {
        const v = parseMspVersionResponse(msg)
        console.log(v)
        if (v.magic === 0xff) {
          writeMsp(createVersionRequest())
        } else {
          console.error("Unsupported board")
          setError("Unsupported board")
          close()
        }
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
  }, [subscribeMsp, writeMsp, disconnect])

  useEffect(() => {
    let timeout = null
    if (connected && version === null) {
      if (versionPending.current === false) { // avoid multiple calls
        versionPending.current = true
        writeMsp(createMspVersionRequest())
        timeout = setTimeout(() => {
          if (versionPending.current && !error) {
            console.error("Version request timeout")
            setError("Connection timeout")
            versionPending.current = false
            close()
          }
        }, 5000)
      }
    } else if (!connected && version !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVersion(null)
      setStatus(null)
      setStatistics(null)
      setError(null)
    }
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [connected, version, writeMsp, error])

  useEffect(() => {
    const interval = setInterval(() => {
      if (connected && !cliActive) {
        writeMsp(createStatusRequest())
        writeMsp(createStatisticsRequest())
      }
    }, 350);
    return () => clearInterval(interval)
  }, [connected, cliActive, writeMsp]);

  const clearError = () => {
    setError(null)
    versionPending.current = false
  }

  return (
    <BoardInfoContext.Provider
      value={{
        version,
        status,
        statistics,
        connected,
        error,
        clearError,
      }}
    >
      {children}
    </BoardInfoContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBoardinfo = () => useContext(BoardInfoContext)

export default BoardInfoProvider