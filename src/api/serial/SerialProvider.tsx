import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useRef,
    useState,
  } from "react";
  
  // RESOURCES:
  // https://web.dev/serial/
  // https://reillyeon.github.io/serial/#onconnect-attribute-0
  // https://codelabs.developers.google.com/codelabs/web-serial
  
  export type PortState = "closed" | "closing" | "open" | "opening";
  
  export type SerialMessage = {
    value: string;
    timestamp: number;
  };
  
  type SerialMessageCallback = (message: SerialMessage) => void;
  
  export interface SerialContextValue {
    canUseSerial: boolean;
    portState: PortState;
    connect(): Promise<boolean>;
    disconnect(): void;
    subscribe(callback: SerialMessageCallback): () => void;
    write: (message: string) => Promise<void>;
  }
  
  export const SerialContext = createContext<SerialContextValue>({
    canUseSerial: false,
    connect: () => Promise.resolve(false),
    disconnect: () => {},
    portState: "closed",
    subscribe: () => () => {},
    write: () => Promise.resolve(),
  });
  
  interface SerialProviderProps {}

  const SerialProvider = ({
    children,
  }: PropsWithChildren<SerialProviderProps>) => {
    const [canUseSerial] = useState(() => "serial" in navigator); 
    const [portState, setPortState] = useState<PortState>("closed");
    const portRef = useRef<SerialPort | null>(null);

    const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
    const readerClosedPromiseRef = useRef<Promise<void>>(Promise.resolve());

    const currentSubscriberIdRef = useRef<number>(0);
    const subscribersRef = useRef<Map<number, SerialMessageCallback>>(new Map());
  
    /**
     * Subscribes a callback function to the message event.
     *
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
     *
     * @param port the port to read from
     */
    const readUntilClosed = async (port: SerialPort) => {
      if (port.readable) {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        readerRef.current = textDecoder.readable.getReader();
  
        try {
          for(;;) {
            const { value, done } = await readerRef.current.read();
            if (done) {
              break;
            }
            const timestamp = Date.now();
            Array.from(subscribersRef.current).forEach(([, callback]) => {
              callback({ value, timestamp });
            });
          }
        } catch (error) {
          console.error(error);
        } finally {
          readerRef.current.releaseLock();
        }
  
        await readableStreamClosed.catch(() => {}); // Ignore the error
      }
    };

    const write = async (message: string) => {
      if (canUseSerial && portState === "open") {
        const port = portRef.current;
        if (port && port.writable) {
          const textEncoder = new TextEncoderStream();
          const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
          const writer = textEncoder.writable.getWriter();     
          try {
            await writer.write(message);
          } catch (error) {
            console.error(error);
          } finally {
            writer.releaseLock()
          }
          await writableStreamClosed.catch(() => {})
        }
      }
    }
  
    /**
     * Attempts to open the given port.
     */
    const openPort = async (port: SerialPort) => {
      try {
        await port.open({ baudRate: 115200 });
        portRef.current = port;
        setPortState("open");
      } catch (error) {
        setPortState("closed");
        console.error("Could not open port");
      }
    };
  
    const manualConnectToPort = async () => {
      if (canUseSerial && portState === "closed") {
        setPortState("opening");
        const filters = [
          // Can identify the vendor and product IDs by plugging in the device and visiting: chrome://device-log/
          // the IDs will be labeled `vid` and `pid`, respectively
          { usbVendorId: 0x1a86, usbProductId: 0x7523 }, // USB Serial
        ];
        try {
          const port = await navigator.serial.requestPort({ filters });
          await openPort(port);
          return true;
        } catch (error) {
          setPortState("closed");
          console.error("User did not select port");
        }
      }
      return false;
    };
  
    const manualDisconnectFromPort = async () => {
      if (canUseSerial && portState === "open") {
        const port = portRef.current;
        if (port) {
          setPortState("closing");
  
          // Cancel any reading from port
          readerRef.current?.cancel();
          await readerClosedPromiseRef.current;
          readerRef.current = null;
  
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [portState]);
  
    return (
      <SerialContext.Provider
        value={{
          canUseSerial,
          subscribe,
          portState,
          connect: manualConnectToPort,
          disconnect: manualDisconnectFromPort,
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