import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { SERIAL_FILTERS } from "./serial"

// RESOURCES:
// https://web.dev/serial/
// https://reillyeon.github.io/serial/#onconnect-attribute-0
// https://codelabs.developers.google.com/codelabs/web-serial
// https://gist.github.com/joshpensky/426d758c5779ac641d1d09f9f5894153

export type PortState = "closed" | "closing" | "open" | "opening";

type SerialMessageCallback = (message: Uint8Array) => void;

export interface SerialContextValue {
  supported: boolean
  connected: boolean
  portState: PortState
  connect(): Promise<boolean>
  disconnect(): Promise<void>
  subscribe(callback: SerialMessageCallback): () => void
  write: (message: Uint8Array) => Promise<void>
}

const SerialContext = createContext<SerialContextValue>({
  supported: false,
  connected: false,
  portState: "closed",
  connect: () => Promise.resolve(false),
  disconnect: () => Promise.resolve(),
  subscribe: () => () => { },
  write: () => Promise.resolve(),
});

type SerialProviderProps = PropsWithChildren & {}

const SerialProvider = ({
  children,
}: SerialProviderProps) => {
  const [supported] = useState(() => "serial" in navigator);
  const [portState, setPortState] = useState<PortState>("closed");
  const portRef = useRef<SerialPort | null>(null);

  const writerRef = useRef<WritableStreamDefaultWriter | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const readerClosedPromiseRef = useRef<Promise<void>>(Promise.resolve());

  const currentSubscriberIdRef = useRef<number>(0);
  const subscribersRef = useRef<Map<number, SerialMessageCallback>>(new Map());

  /**
   * Subscribes a callback function to the message event.
   * @param callback the callback function to subscribe
   * @returns an unsubscribe function
   */
  const subscribe = (callback: SerialMessageCallback) => {
    const id = currentSubscriberIdRef.current;
    subscribersRef.current.set(id, callback);
    currentSubscriberIdRef.current++;
    return () => {
      subscribersRef.current.delete(id);
    };
  };

  /**
   * Reads from the given port until it's been closed.
   * @param port the port to read from
   */
  const readUntilClosed = async (port: SerialPort) => {
    if (port.readable) {
      readerRef.current = port.readable.getReader();
      try {
        for (; ;) {
          const { value, done } = await readerRef.current.read();
          if (done) break;
          Array.from(subscribersRef.current).forEach(([, callback]) => {
            callback(value);
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        readerRef.current.releaseLock();
      }
    }
  };

  const write = async (data: Uint8Array) => {
    if (supported && portState === "open") {
      const port = portRef.current;
      if (port && port.writable) {
        writerRef.current = port.writable.getWriter();
        try {
          await writerRef.current.write(data);
        } catch (error) {
          console.error(error);
        } finally {
          writerRef.current.releaseLock()
        }
      }
    }
  }

  const connect = async () => {
    if (supported && portState === "closed") {
      setPortState("opening");
      try {
        portRef.current = await navigator.serial.requestPort({ filters: SERIAL_FILTERS });;
        await portRef.current.open({ baudRate: 115200 });
        setPortState("open");
        return true;
      } catch (err) {
        setPortState("closed");
        console.error(err)
        console.error("User did not select port");
      }
    }
    return false;
  };

  const disconnect = async () => {
    if (supported && portState === "open") {
      const port = portRef.current;
      if (port) {
        setPortState("closing");

        // Cancel any reading from port
        readerRef.current?.cancel();
        await readerClosedPromiseRef.current;
        readerRef.current = null;

        // close writeable
        //writerRef.current?.close();
        //writerRef.current = null;

        // Close and nullify the port
        await port.close();
        portRef.current = null;

        // Update port state
        setPortState("closed");
      }
    }
  };

  /**
   * Event handler for when the port is disconnected unexpectedly.
   */
  const onPortDisconnect = async () => {
    // Wait for the reader to finish it's current loop
    await readerClosedPromiseRef.current;
    // Update state
    readerRef.current = null;
    readerClosedPromiseRef.current = Promise.resolve();

    writerRef.current = null;

    portRef.current = null;
    setPortState("closed");
  };

  // Handles attaching the reader and disconnect listener when the port is open
  useEffect(() => {
    const port = portRef.current;
    if (portState === "open" && port) {
      // When the port is open, read until closed
      const aborted = { current: false };
      readerRef.current?.cancel();
      readerClosedPromiseRef.current.then(() => {
        if (!aborted.current) {
          readerRef.current = null;
          readerClosedPromiseRef.current = readUntilClosed(port);
        }
      });

      // Attach a listener for when the device is disconnected
      navigator.serial.addEventListener("disconnect", onPortDisconnect);

      return () => {
        aborted.current = true;
        navigator.serial.removeEventListener("disconnect", onPortDisconnect);
      };
    }
  }, [portState]);

  const connected = portState === "open";

  return (
    <SerialContext.Provider
      value={{
        supported,
        connected,
        portState,
        connect,
        disconnect,
        subscribe,
        write,
      }}
    >
      {children}
    </SerialContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSerial = () => useContext(SerialContext);

export default SerialProvider;