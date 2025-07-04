import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useSerial } from '@/api/serial/SerialProvider'
import { MspCommand, MspDirection, MspMessage, mspParse, MspState } from "@/api/msp/msp"
import { createDisableArmRequest, createVersionRequest, EspVersionResponse, parseVersionResponse } from "../esp"

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

class Queue<T> {

  private items: Array<T>

  constructor() {
    this.items = [];
  }

  enqueue(element: T) {
    this.items.push(element);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

class TimedLock {
  private timer: ReturnType<typeof setTimeout> | null = null;

  acquire(durationMs: number = 100): boolean {
    if (this.timer !== null) return false
    this.timer = setTimeout(() => {
      this.timer = null;
    }, durationMs);
    return true
  }

  release(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  isActive(): boolean {
    return this.timer !== null;
  }
}

type MspProviderProps = PropsWithChildren & {}

const MspProvider = ({
  children,
}: MspProviderProps) => {

  const { write, subscribe, connect: serialConnect, disconnect: serialDisconnect, portState, connected } = useSerial()

  const currentSubscriberIdRef = useRef(0)
  const mspSubscribersRef = useRef(new Map<number, MspMessageCallback>())
  const textSubscribersRef = useRef(new Map<number, TextMessageCallback>())
  const msgQueueRef = useRef(new Queue<MspMessage>())
  const msgQueueLockRef = useRef(new TimedLock())
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
          if(msgRef.current.cmd > 0xf) console.log("msp.recv", msgRef.current.cmd)
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
  const writeMsp = useCallback(async (msg: MspMessage) => {
    if(msg.cmd > 0xf) console.log("msp.enque", msgQueueRef.current.size(), msgQueueLockRef.current.isActive(), msg.cmd)
    msgQueueRef.current.enqueue(msg)
  }, [])

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
    if (!connected) return;
    const interval = setInterval(() => {
      if (!msgQueueLockRef.current.isActive() && !msgQueueRef.current.isEmpty()) {
        msgQueueLockRef.current.acquire(100)
        const msg = msgQueueRef.current.dequeue()!
        if(msg.cmd > 0xf) console.log("msp.send", msg.cmd)
        write(msg.toDataBuffer())
      }
    }, 5);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected, write])

  useEffect(() => {
    return subscribe((message: Uint8Array) => {
      receive(message)
    })
  })

  useEffect(() => {
    return subscribeMsp((msg: MspMessage) => {
      if (msg.isCmd(MspCommand.ESP_CMD_VERSION)) {
        setVersion(parseVersionResponse(msg))
        writeMsp(createDisableArmRequest({ type: 1 }))
      }
    })
  })

  useEffect(() => {
    if (portState == "open" && version === null) {
      writeMsp(createVersionRequest())
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
