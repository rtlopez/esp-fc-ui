import { createContext, PropsWithChildren, useContext, useEffect, useRef  } from "react"
import { useSerial } from '@/api/serial/SerialProvider'
import { MspDirection, MspMessage, mspParse, MspState } from "@/api/msp/msp"

type MspMessageCallback = (message: MspMessage) => void
type TextMessageCallback = (message: string) => void

export interface MspContextValue {
  subscribeMsp(callback: MspMessageCallback): () => void
  writeMsp: (message: MspMessage) => Promise<void>
  subscribeText(callback: TextMessageCallback): () => void
  writeText: (message: string) => Promise<void>
}

const MspContext = createContext<MspContextValue>({
  subscribeMsp: () => () => { },
  writeMsp: () => Promise.resolve(),
  subscribeText: () => () => { },
  writeText: () => Promise.resolve(),
});

type MspProviderProps = PropsWithChildren & {}

const MspProvider = ({
  children,
}: MspProviderProps) => {

  const { write, subscribe } = useSerial()

  const currentSubscriberIdRef = useRef(0)
  const mspSubscribersRef = useRef(new Map<number, MspMessageCallback>())
  const textSubscribersRef = useRef(new Map<number, TextMessageCallback>())
  const msgRef = useRef(new MspMessage())

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
  const writeMsp = async (msg: MspMessage) => {
    write(msg.toDataBuffer())
  }

  const subscribeText = (callback: TextMessageCallback) => {
    const id = currentSubscriberIdRef.current
    textSubscribersRef.current.set(id, callback)
    currentSubscriberIdRef.current++
    return () => {
      textSubscribersRef.current.delete(id)
    }
  }
  const writeText = async (message: string) => {
    const enc = new TextEncoder()
    const data = enc.encode(message + "\n")
    write(data)
  }

  useEffect(() => {
    return subscribe((message: Uint8Array) => {
      receive(message)
    })
  })

  return (
    <MspContext.Provider
      value={{
        subscribeMsp,
        writeMsp,
        subscribeText,
        writeText,
      }}
    >
      {children}
    </MspContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMsp = () => useContext(MspContext)

export default MspProvider
