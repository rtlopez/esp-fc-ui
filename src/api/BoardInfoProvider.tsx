import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"
import { useMsp } from "./msp/MspProvider"
import {
  createDisableArmRequest, createMspVersionRequest, createStatisticsRequest,
  createStatusRequest, createVersionRequest, EspStatisticsResponse,
  EspStatusResponse, EspVersionResponse, parseMspVersionResponse,
  parseStatisticsResponse, parseStatusResponse, parseVersionResponse
} from "./esp"
import { useIntervalMsp } from "./hook/useIntervalMsp"

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

const BoardInfoProvider = ({ children }: BoardInfoProviderProps) => {

  const { connected, send, disconnect, setInitialized } = useMsp()
  const [version, setVersion] = useState<EspVersionResponse | null>(null)
  const [status, setStatus] = useState<EspStatusResponse | null>(null)
  const [statistics, setStatistics] = useState<EspStatisticsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (connected && version === null) {
        // was disconnectd and is now connected
        console.log("board.connecting...")
        try {
          const u = parseMspVersionResponse(await send(createMspVersionRequest()))
          console.log('msp.ver:', u)
          if (u.magic !== 0xff) throw new Error("Unsupported board, go to the CLI tab or update firmware!")
          const v = parseVersionResponse(await send(createVersionRequest()))
          console.log('esp.ver: ', v)
          setVersion(v)
          await send(createDisableArmRequest({ type: 1 }))
          setInitialized(true)
          console.log("board.connected")
        } catch (e) {
          if (e instanceof Error) {
            console.error("Connection failed: ", e.message)
            setError("Error: " + e.message)
          } else {
            console.error("Connection failed: ", e)
            setError("Unexpected connection error!")
          }
          //await disconnect()
        }
      } else if (!connected && version !== null) {
        // was connected but is disconnected now
        setInitialized(false)
        setVersion(null)
        setStatus(null)
        setStatistics(null)
        console.log("board.disconnected")
      }
    }
    load()
  }, [connected, version, send, disconnect, setInitialized])

  useIntervalMsp(useCallback(async () => {
    try {
      setStatus(parseStatusResponse(await send(createStatusRequest())))
      setStatistics(parseStatisticsResponse(await send(createStatisticsRequest())))
    } catch (e) {
      console.error(e)
    }
  }, [send]), 350)

  const clearError = () => {
    setError(null)
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
export const useBoardInfo = () => useContext(BoardInfoContext)

export default BoardInfoProvider