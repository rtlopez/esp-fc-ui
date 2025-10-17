import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react"
import { useSerial } from '@/api/serial/SerialProvider'
import { MspCommand, MspMessage, mspParse, MspVariant } from "@/api/msp/msp"
import Queue from "@/api/Queue"
import TimedLock from "@/api/TimedLock"

type MspMessageCallback = (message: MspMessage) => void
type TextMessageCallback = (message: string) => void

const textEncoder = new TextEncoder()

export interface MspContextValue {
  subscribeMsp(callback: MspMessageCallback): () => void
  writeMsp: (message: MspMessage) => void
  useIntervalMsp: (calback: () => void, delay: number) => void
  send: (msg: MspMessage) => Promise<MspMessage>
  subscribeText(callback: TextMessageCallback): () => void
  writeText: (message: string) => Promise<void>
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  cliActive: boolean,
  setCliActive: (value: boolean) => void,
  connected: boolean
}

const MspContext = createContext<MspContextValue>({
  subscribeMsp: () => () => { },
  writeMsp: () => { },
  useIntervalMsp: (_calback: () => void, _delay: number) => { },
  send: async (_msg: MspMessage) => Promise.resolve(new MspMessage(0)),
  subscribeText: () => () => { },
  writeText: () => Promise.resolve(),
  connect: () => Promise.resolve(false),
  disconnect: () => Promise.resolve(),
  cliActive: false,
  setCliActive: (_value: boolean) => { },
  connected: false,
});

type MspProviderProps = PropsWithChildren & {}

const logMsg = (msg: MspMessage) => {
  if (msg.variant === 'E') {
    return msg.cmd === MspCommand.ESP_CMD_VERSION.value || msg.cmd >= MspCommand.ESP_CMD_MODE_NAMES.value
  }
  return true
}

type PendingItem = {
  resolve: (value: MspMessage) => void
  reject: (reason?: unknown) => void
  timeout: NodeJS.Timeout
}

export class MspError extends Error {
  variant?: MspVariant
  cmd?: number
  constructor(variant: MspVariant, cmd: number, message: string) {
    super(message)
    this.name = "MspError"
    this.variant = variant
    this.cmd = cmd
  }
}

const MspProvider = ({ children }: MspProviderProps) => {

  const { write, subscribe, connect: serialConnect, disconnect: serialDisconnect, connected } = useSerial()

  const currentSubscriberIdRef = useRef(0)
  const mspSubscribersRef = useRef(new Map<number, MspMessageCallback>())
  const textSubscribersRef = useRef(new Map<number, TextMessageCallback>())
  const msgQueueRef = useRef(new Queue<MspMessage>())
  const msgQueueLockRef = useRef(new TimedLock())
  const msgRef = useRef(new MspMessage())
  const [cliActive, setCliActive] = useState(false)
  const pendingRef = useRef(new Map<string, PendingItem>())

  const writeMsp = (msg: MspMessage) => {
    if (logMsg(msg)) console.log("msp.enque", msgQueueRef.current.size(), msgQueueLockRef.current.isActive(), msg.variant, msg.cmd.toString(16).toUpperCase())
    msgQueueRef.current.enqueue(msg)
  }

  const send = async (msg: MspMessage): Promise<MspMessage> => {
    return new Promise((resolve, reject) => {
      const key = `${msg.variant}-${msg.cmd}`
      pendingRef.current.set(key, {
        resolve,
        reject,
        timeout: setTimeout(() => {
          pendingRef.current.delete(key)
          reject(new MspError(msg.variant, msg.cmd, 'Msp command timeout'))
        }, 2000)
      })
      writeMsp(msg)
    })
  }

  const receive = (data: Uint8Array) => {
    let text = '';
    data.forEach(b => {
      const consumed = mspParse(b, msgRef.current)
      //console.log([consumed, b, msg.state, msg.dir, msg.received, msg.size, msg.checksum])
      if (consumed) {
        if (msgRef.current.isReplyReceived()) {
          // notify msp subscribers
          if (logMsg(msgRef.current)) console.log("msp.recv", msgRef.current.variant, msgRef.current.cmd.toString(16).toUpperCase(), msgRef.current.toArray())
          const key = `${msgRef.current.variant}-${msgRef.current.cmd}`
          const pending = pendingRef.current.get(key)
          if (pending) {
            clearTimeout(pending.timeout)
            pendingRef.current.delete(key)
            pending.resolve(msgRef.current)
          }
          Array.from(mspSubscribersRef.current).forEach(([, callback]) => {
            callback(msgRef.current);
          });
          msgRef.current = new MspMessage()
          msgQueueLockRef.current.release()
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

  const subscribeText = (callback: TextMessageCallback) => {
    const id = currentSubscriberIdRef.current
    textSubscribersRef.current.set(id, callback)
    currentSubscriberIdRef.current++
    return () => {
      textSubscribersRef.current.delete(id)
    }
  }

  const writeText = async (message: string) => {
    await write(textEncoder.encode(message + "\n"))
  }

  const useIntervalMsp = (callback: () => void, delay: number) => {
    useEffect(() => {
      const interval = setInterval(() => {
        if (connected && !cliActive) callback();
      }, delay);
      return () => clearInterval(interval);
    }, [callback, delay]);
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      if (connected && !msgQueueLockRef.current.isActive() && !msgQueueRef.current.isEmpty()) {
        msgQueueLockRef.current.acquire(100)
        const msg = msgQueueRef.current.dequeue()!
        if (logMsg(msg)) console.log("msp.send", msg.variant, msg.cmd.toString(16).toUpperCase(), msg.toArray())
        await write(msg.toDataBuffer())
      }
    }, 5);
    return () => clearInterval(interval);
  }, [connected, write])

  useEffect(() => {
    return subscribe((message: Uint8Array) => {
      receive(message)
    })
  })

  const connect = async () => {
    return await serialConnect()
  }

  const disconnect = async () => {
    await serialDisconnect()
  }

  return (
    <MspContext.Provider
      value={{
        subscribeMsp,
        writeMsp,
        useIntervalMsp,
        send,
        subscribeText,
        writeText,
        connect,
        disconnect,
        cliActive,
        setCliActive,
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
