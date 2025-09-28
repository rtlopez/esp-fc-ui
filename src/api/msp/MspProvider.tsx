import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react"
import { useSerial } from '@/api/serial/SerialProvider'
import { MspMessage, mspParse } from "@/api/msp/msp"

type MspMessageCallback = (message: MspMessage) => void
type TextMessageCallback = (message: string) => void

const textEncoder = new TextEncoder()

export interface MspContextValue {
  subscribeMsp(callback: MspMessageCallback): () => void
  writeMsp: (message: MspMessage) => Promise<void>
  useIntervalMsp: (calback: () => void, delay: number) => void
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
  writeMsp: () => Promise.resolve(),
  useIntervalMsp: (_calback: () => void, _delay: number) => { },
  subscribeText: () => () => { },
  writeText: () => Promise.resolve(),
  connect: () => Promise.resolve(false),
  disconnect: () => Promise.resolve(),
  cliActive: false,
  setCliActive: (_value: boolean) => { },
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

  const { write, subscribe, connect: serialConnect, disconnect: serialDisconnect, connected } = useSerial()

  const currentSubscriberIdRef = useRef(0)
  const mspSubscribersRef = useRef(new Map<number, MspMessageCallback>())
  const textSubscribersRef = useRef(new Map<number, TextMessageCallback>())
  const msgQueueRef = useRef(new Queue<MspMessage>())
  const msgQueueLockRef = useRef(new TimedLock())
  const msgRef = useRef(new MspMessage())
  const [cliActive, setCliActive] = useState(false)

  const receive = (data: Uint8Array) => {
    let text = '';
    data.forEach(b => {
      const consumed = mspParse(b, msgRef.current)
      //console.log([consumed, b, msg.state, msg.dir, msg.received, msg.size, msg.checksum])
      if (consumed) {
        if (msgRef.current.isReplyReceived()) {
          // notify msp subscribers
          if (msgRef.current.cmd > 0xf) console.log("msp.recv", msgRef.current.cmd, msgRef.current.toArray())
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

  const writeMsp = async (msg: MspMessage) => {
    if (msg.cmd > 0xf) console.log("msp.enque", msgQueueRef.current.size(), msgQueueLockRef.current.isActive(), msg.cmd)
    msgQueueRef.current.enqueue(msg)
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
        if(connected && !cliActive) callback();
      }, delay);
      return () => clearInterval(interval);
    }, [callback, delay]);
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      if (connected && !msgQueueLockRef.current.isActive() && !msgQueueRef.current.isEmpty()) {
        msgQueueLockRef.current.acquire(100)
        const msg = msgQueueRef.current.dequeue()!
        if (msg.cmd > 0xf) console.log("msp.send", msg.cmd, msg.toArray())
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
