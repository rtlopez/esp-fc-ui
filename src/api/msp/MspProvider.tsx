import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState } from "react"
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
  send: (msg: MspMessage) => Promise<MspMessage>
  subscribeText(callback: TextMessageCallback): () => void
  writeText: (message: string) => Promise<void>
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  cliActive: boolean,
  setCliActive: (value: boolean) => void,
  connected: boolean
  rebooting: boolean
  saving: boolean
  initialized: boolean
  setInitialized: (value: boolean) => void
}

const MspContext = createContext<MspContextValue>({
  subscribeMsp: () => () => { },
  writeMsp: () => { },
  send: async (_msg: MspMessage) => Promise.resolve(new MspMessage(0)),
  subscribeText: () => () => { },
  writeText: () => Promise.resolve(),
  connect: () => Promise.resolve(false),
  disconnect: () => Promise.resolve(),
  cliActive: false,
  setCliActive: (_value: boolean) => { },
  connected: false,
  rebooting: false,
  saving: false,
  initialized: false,
  setInitialized: (_value: boolean) => { },
});

type MspProviderProps = PropsWithChildren & {}

type PendingItem = {
  msg: MspMessage
  resolve: (value: MspMessage) => void
  reject: (reason?: unknown) => void
  timer: ReturnType<typeof setTimeout>
  time: number
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

const logMsg = (msg: MspMessage) => {
  if (msg.variant === 'E') {
    return (msg.cmd === MspCommand.ESP_CMD_VERSION.value || msg.cmd >= MspCommand.ESP_CMD_MODE_NAMES.value) &&
      msg.cmd !== MspCommand.ESP_CMD_FLASH_READ.value
  }
  return true
}

const getKey = (msg: MspMessage) => {
  return `${msg.variant}:${msg.cmd.toString(16).toUpperCase().padStart(2, '0')}`
}

const MspProvider = ({ children }: MspProviderProps) => {

  const { write, subscribe, connect: serialConnect, disconnect: serialDisconnect, connected } = useSerial()

  const currentSubscriberIdRef = useRef(0)
  const mspSubscribersRef = useRef(new Map<number, MspMessageCallback>())
  const textSubscribersRef = useRef(new Map<number, TextMessageCallback>())
  const msgQueueRef = useRef(new Queue<MspMessage>())
  const msgQueueLockRef = useRef(new TimedLock())
  const msgRef = useRef(new MspMessage())
  const pendingRef = useRef(new Map<string, PendingItem>())
  const [cliActive, setCliActive] = useState(false)
  const [rebooting, setRebooting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const rebootingRef = useRef(false)

  useEffect(() => {
    rebootingRef.current = rebooting
  }, [rebooting])

  const writeMsp = useCallback((msg: MspMessage) => {
    //if (logMsg(msg)) console.log("msp.enqu", msgQueueRef.current.size(), msgQueueLockRef.current.isActive(), msg.toId())
    msgQueueRef.current.enqueue(msg)
  }, [])

  const send = useCallback(async (msg: MspMessage): Promise<MspMessage> => {
    return new Promise((resolve, reject) => {
      const key = getKey(msg)
      if (rebootingRef.current) {
        reject(new MspError(msg.variant, msg.cmd, `Msp (${key}) rejected: rebooting`))
        return
      }
      if (pendingRef.current.get(key)) {
        reject(new MspError(msg.variant, msg.cmd, `Msp (${key}) rejected: already in queue`))
        return
      }
      pendingRef.current.set(key, {
        msg,
        time: new Date().getTime(),
        resolve,
        reject,
        timer: setTimeout(() => {
          pendingRef.current.delete(key)
          reject(new MspError(msg.variant, msg.cmd, `Msp (${key}) command timeout`))
        }, 2000)
      })
      writeMsp(msg)
    })
  }, [writeMsp])

  const receive = (data: Uint8Array) => {
    let text = '';
    data.forEach(b => {
      const consumed = mspParse(b, msgRef.current)
      //console.log([consumed, b, msgRef.current.state, msgRef.current.dir, msgRef.current.received, msgRef.current.size, msgRef.current.checksum])
      if (consumed) {
        if (msgRef.current.isReplyReceived()) {
          // notify msp subscribers
          const key = getKey(msgRef.current)
          const pending = pendingRef.current.get(key)
          let msgTime = 0
          if (pending) {
            msgTime = new Date().getTime() - pending.time
            clearTimeout(pending.timer)
            pendingRef.current.delete(key)
            pending.resolve(msgRef.current)
          }
          if (logMsg(msgRef.current)) console.log("msp.recv", msgRef.current.toId(), `${msgTime}ms`, msgRef.current.toArray())
          Array.from(mspSubscribersRef.current).forEach(([, callback]) => {
            callback(msgRef.current);
          });
          if (msgRef.current.isCmd(MspCommand.ESP_CMD_REBOOT)) {
            console.log('msp.reboot.ack')
          }
          if (msgRef.current.isCmd(MspCommand.ESP_CMD_SAVE)) {
            console.log('msp.save.ack')
            setSaving(false)
          }
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

  useEffect(() => {
    const interval = setInterval(async () => {
      if (connected && !msgQueueLockRef.current.isActive() && !msgQueueRef.current.isEmpty()) {
        msgQueueLockRef.current.acquire(100)
        const msg = msgQueueRef.current.dequeue()!
        if (logMsg(msg)) console.log("msp.send", msg.toId(), msg.toArray())
        if (msg.isCmd(MspCommand.ESP_CMD_REBOOT)) {
          console.log('msp.rebooting...')
          setRebooting(true)
          rebootingRef.current = true
          setTimeout(() => {
            setRebooting(false)
            rebootingRef.current = false
          }, 500)
        }
        if (msg.isCmd(MspCommand.ESP_CMD_SAVE)) {
          console.log('msp.saving...')
          setSaving(true)
        }
        await write(msg.toDataBuffer())
      }
    }, 3);
    return () => clearInterval(interval);
  }, [connected, write])

  useEffect(() => {
    return subscribe((message: Uint8Array) => {
      receive(message)
    })
  })

  const clearQueues = () => {
    msgQueueRef.current.empty()
    pendingRef.current.forEach((pending, key) => {
      clearTimeout(pending.timer)
      pending.reject(new MspError(pending.msg.variant, pending.msg.cmd, `Msp (${key}) command rejected: disconnected`))
    })
    pendingRef.current.clear()
  }

  const connect = async () => {
    clearQueues()
    return await serialConnect()
  }

  const disconnect = async () => {
    clearQueues()
    await serialDisconnect()
  }

  return (
    <MspContext.Provider
      value={{
        subscribeMsp,
        writeMsp,
        send,
        subscribeText,
        writeText,
        connect,
        disconnect,
        cliActive,
        setCliActive,
        connected,
        rebooting,
        saving,
        initialized,
        setInitialized,
      }}
    >
      {children}
    </MspContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useMsp = () => useContext(MspContext)

export default MspProvider
