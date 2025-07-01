import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useSerial } from '@/api/serial/SerialProvider'
import { MspCommand, MspDirection, MspMessage, mspParse, MspState } from "@/api/msp/msp"
import { EspVersionResponse, parseVersionResponse } from "../esp"

type MspMessageCallback = (message: MspMessage) => void
type TextMessageCallback = (message: string) => void

const textEncoder = new TextEncoder()

export interface MspContextValue {
  subscribeMsp(callback: MspMessageCallback): () => void
  writeMsp: (message: MspMessage) => Promise<void>
  subscribeText(callback: TextMessageCallback): () => void
  writeText: (message: string) => Promise<void>
  connect(): Promise<boolean>
  disconnect(): void
  version: EspVersionResponse | null
  connected: boolean
}

const MspContext = createContext<MspContextValue>({
  subscribeMsp: () => () => { },
  writeMsp: () => Promise.resolve(),
  subscribeText: () => () => { },
  writeText: () => Promise.resolve(),
  connect: () => Promise.resolve(false),
  disconnect: () => { },
  version: null,
  connected: false,
});

type MspProviderProps = PropsWithChildren & {}

const MspProvider = ({
  children,
}: MspProviderProps) => {

  const { write, subscribe, connect: serialConnect, disconnect: serialDisconnect, portState, connected } = useSerial()

  const currentSubscriberIdRef = useRef(0)
  const mspSubscribersRef = useRef(new Map<number, MspMessageCallback>())
  const textSubscribersRef = useRef(new Map<number, TextMessageCallback>())
  const msgRef = useRef(new MspMessage())
  const [version, setVersion] = useState<EspVersionResponse | null>(null)

  const receive = (data: Uint8Array) => {
    let text = '';
    data.forEach(b => {
      const consumed = mspParse(b, msgRef.current)
      //console.log([consumed, b, msg.state, msg.dir, msg.received, msg.size, msg.checksum])
      if (consumed) {
        if (msgRef.current.state === MspState.RECEIVED && msgRef.current.dir === MspDirection.REPLY) {
          // notify msp subscribers
          Array.from(mspSubscribersRef.current).forEach(([, callback]) => {
            callback(msgRef.current);
          });
          msgRef.current = new MspMessage()
        }
      } else {
        text += String.fromCharCode(b)
      }
    })
    if (text !== '') {
      // notify cli subscribers
      Array.from(textSubscribersRef.current).forEach(([, callback]) => {
        callback(text)
      })
    }
  }

  const subscribeMsp = (callback: MspMessageCallback) => {
    const id = currentSubscriberIdRef.current
    mspSubscribersRef.current.set(id, callback)
    currentSubscriberIdRef.current++
    return () => {
      mspSubscribersRef.current.delete(id)
    }
  }
  const writeMsp = useCallback(async (msg: MspMessage) => {
    write(msg.toDataBuffer())
  }, [write])

  const subscribeText = (callback: TextMessageCallback) => {
    const id = currentSubscriberIdRef.current
    textSubscribersRef.current.set(id, callback)
    currentSubscriberIdRef.current++
    return () => {
      textSubscribersRef.current.delete(id)
    }
  }
  const writeText = async (message: string) => {
    write(textEncoder.encode(message + "\n"))
  }

  useEffect(() => {
    return subscribe((message: Uint8Array) => {
      receive(message)
    })
  })

  useEffect(() => {
    return subscribeMsp((msg: MspMessage) => {
      if (msg.isA(MspCommand.ESP_CMD_VERSION)) {
        setVersion(parseVersionResponse(msg))
      }
    })
  })

  useEffect(() => {
    if (portState == "open" && version === null) {
      writeMsp(new MspMessage(MspCommand.ESP_CMD_VERSION))
    }
  }, [writeMsp, portState, version])

  const connect = async () => {
    return await serialConnect()
  }

  const disconnect = async () => {
    setVersion(null)
    serialDisconnect()
  }

  return (
    <MspContext.Provider
      value={{
        subscribeMsp,
        writeMsp,
        subscribeText,
        writeText,
        connect,
        disconnect,
        version,
        connected,
      }}
    >
      {children}
    </MspContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMsp = () => useContext(MspContext)

export default MspProvider
