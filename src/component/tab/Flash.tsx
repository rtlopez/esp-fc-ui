import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Card, Col, Form, ProgressBar, Row, Spinner } from 'react-bootstrap'
import { SERIAL_FILTERS } from '@/api/serial/serial'
import { useMsp } from '@/api/msp/MspProvider'
import { ESPLoader, FlashOptions, Transport } from 'esptool-js'
//import { serial, SerialPort as SerialPortPoly } from 'web-serial-polyfill'
import {
  calcChecksum, extractZipFile, getLocalFirmware, getRemoteFirmware,
  toBinaryString, validateChecksum, FirmwareVersion
} from '@/api/firmware'
import { useBlobAccumulator } from '@/api/hook/useBlobAccumulator'

// https://github.com/espressif/esptool-js/blob/feature/detect-chip/examples/typescript/src/index.ts

type SerialPortType = SerialPort

//const serialLib = !navigator.serial && navigator.usb ? serial : navigator.serial;
//const serialLib = serial
const serialLib = navigator.serial

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '')
const VERSIONS_URL = `${BASE_URL}/fw/versions.json`

const getFwUrl = (fw: FirmwareVersion) => {
  return `${BASE_URL}/fw/${fw.version}/${fw.file}`
}

const formatFlashSize = (size: number | null): string => {
  if (size === null) return 'Unknown'
  if (size >= 1024) {
    return (size / 1024).toFixed(0) + 'MB'
  }
  return size + ' KB'
}

const preStyle = {
  border: '1px solid var(--bs-border-color)',
  borderRadius: 'var(--bs-border-radius)',
  background: 'var(--bs-tertiary-bg)',
  color: 'var(--bs-tertiary-color)',
  padding: '2px', margin: '2px', minHeight: '280px', maxHeight: '280px'
}

const baudRates = [921600, 460800, 230400, 115200]

const types = [
  { id: 'released', name: 'Released' },
  { id: 'experimental', name: 'Experimental' },
]

const stables = ['ESP32', 'ESP32-S3']

const makeBoards = (versions: FirmwareVersion[]) => {
  const boards = versions.filter(v => v.board && v.board != 'ALL')
  const boardNames = [...new Set(boards.map(v => {
    return stables.includes(v.board) ? v.board : `${v.board} Experimental`
  }))]
  return boardNames.sort((a, b) => a.localeCompare(b))
}

const FlashTab = () => {

  const { connected } = useMsp()
  const [isConnected, setIsConnected] = useState<'disconnected' | 'detecting' | 'disconnecting' | 'connected'>('disconnected')
  const deviceRef = useRef<SerialPortType | null>(null)
  const transportRef = useRef<Transport | null>(null)
  const espLoaderRef = useRef<ESPLoader | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [board, setBoard] = useState<string>('')
  const [boards, setBoards] = useState<string[]>([])
  const [boardFeatures, setBoardFeatures] = useState<string | null>(null)
  const [boardFlashSize, setBoardFlashSize] = useState<number | null>(null)
  const [fwType, setFwType] = useState<string>('released')
  const [fwIndex, setFwIndex] = useState<number>(0)
  const [firmwares, setFirmwares] = useState<FirmwareVersion[]>([])
  const [progress, setProgress] = useState<number>(0)
  const [baudRate, setBaudRate] = useState<number>(460800)
  const [terminalContents, setTerminalContents] = useState<string>('')
  const { download } = useBlobAccumulator("application/octet-stream")

  const espLoaderTerminal = {
    clean() {
    },
    writeLine(data: string) {
      setTerminalContents((old) => old + data + '\n')
    },
    write(data: string) {
      setTerminalContents((old) => old + data)
    },
  }

  const fetched = useRef(false)
  useEffect(() => {
    if (fetched.current) return
    fetched.current = true
    const loadFirmwares = async () => {
      try {
        const res = await fetch(VERSIONS_URL)
        const data = await res.json() as FirmwareVersion[]
        setFirmwares([{ version: 'Choose', board: 'ALL', file: '', group: 'released' }, ...data])
        setBoards(['Choose', ...makeBoards(data)])
      } catch (e) {
        console.error(e)
      }
    }
    loadFirmwares()
  }, [])

  // useEffect(() => {
  //   const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  //     if (isConnected) {
  //       e.preventDefault()
  //     }
  //   }
  //   window.addEventListener('beforeunload', handleBeforeUnload)
  //   return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  // }, [isConnected])

  const boardConnect = async () => {
    deviceRef.current = await serialLib.requestPort({ filters: SERIAL_FILTERS }) as SerialPortType
    transportRef.current = new Transport(deviceRef.current)
    transportRef.current.trace = () => { }
    setIsConnected('detecting')
    espLoaderRef.current = new ESPLoader({
      transport: transportRef.current,
      terminal: espLoaderTerminal,
      baudrate: baudRate,
      romBaudrate: 115200,
      //debugLogging: true,
      //enableTracing: true,
      //port: deviceRef.current,
      // serialOptions: {
      //   baudRate: 115200,
      //   bufferSize: 32 * 1024,
      // },
    })
    const chip = await espLoaderRef.current.main()
    const features = await espLoaderRef.current.chip.getChipFeatures(espLoaderRef.current)
    const flashSize = await espLoaderRef.current.getFlashSize()
    setBoardFlashSize(flashSize)
    setBoard(espLoaderRef.current.chip.CHIP_NAME)
    setBoardFeatures(features.map(i => i.trim()).join(', '))
    setIsConnected('connected')
    console.log("Connected to: " + chip)
  }

  const _disconnect = async () => {
    if (transportRef.current) {
      console.log('Disconnecting...')
      await transportRef.current.disconnect()
      transportRef.current = null
      deviceRef.current = null
      espLoaderRef.current = null
      setBoard('')
      setBoardFeatures(null)
      setBoardFlashSize(null)
      setProgress(0)
      setTerminalContents('')
      console.log('Disconnected')
    }
  }

  const boardDisconnect = async () => {
    setIsConnected('disconnecting')
    await _disconnect()
    setIsConnected('disconnected')
  }

  const boardRestart = async () => {
    setIsConnected('disconnecting')
    if (transportRef.current) {
      console.log('Restarting...')
      await transportRef.current.setDTR(false)
      await new Promise((resolve) => setTimeout(resolve, 100))
      await transportRef.current.setDTR(true)
      console.log('Restrted')
    }
    await _disconnect()
    await new Promise((resolve) => setTimeout(resolve, 500))
    setIsConnected('disconnected')
  }

  const isLocalIndex = () => {
    return fwIndex === firmwares.length - 1
  }

  const validateInput = () => {
    if (firmwares.length < 2) return 'No firmware versions available'
    if (fwIndex == 0) return 'No remote firmware selected'
    if (isLocalIndex() && !fileInputRef.current?.files?.length) return 'No local firmware selected'
    return null
  }

  const boardFlash = async () => {
    if (espLoaderRef.current) {
      const err = validateInput()
      if (err) {
        alert(err)
        return
      }
      try {
        let data = null
        if (isLocalIndex() && fileInputRef.current?.files?.[0]) {
          data = await getLocalFirmware(fileInputRef.current.files[0])
        } else if (fwIndex > 0) {
          const fwUrl = getFwUrl(firmwares[fwIndex])
          data = await getRemoteFirmware(fwUrl)
        } else {
          throw new Error('No firmware file selected')
        }

        data = await extractZipFile(data)

        if (!validateChecksum(data, firmwares[fwIndex].checksum)) {
          throw new Error('Checksum validation failed')
        }

        data = toBinaryString(data)

        if (!validateChecksum(data, firmwares[fwIndex].checksum)) {
          throw new Error('Checksum validation failed')
        }

        const options: FlashOptions = {
          fileArray: [{ address: 0x0000, data: data }],
          eraseAll: false,
          compress: true,
          flashFreq: "keep",
          flashMode: "keep",
          flashSize: "keep",
          calculateMD5Hash: (image) => calcChecksum(image),
          reportProgress: (_fileIndex, written, total) => {
            setProgress(Math.floor((written / total) * 100))
          },
        }
        await espLoaderRef.current.writeFlash(options)
        await espLoaderRef.current.after()
        console.log("Flashing completed")
      } catch (e) {
        console.error(e)
      }
    }
  }

  const boardRead = async () => {
    if (espLoaderRef.current) {
      try {
        const start = 0x00000
        const length = (boardFlashSize || 1024) * 1024
        const data = (await espLoaderRef.current.readFlash(start, length, (_packet, size, total) => {
          setProgress(Math.floor((size / total) * 100))
        })).buffer as ArrayBuffer
        const blob = new Blob([data], { type: "application/octet-stream" });
        download(blob, `download_${board}.bin`)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const boardErase = async () => {
    try {
      if (espLoaderRef.current) {
        await espLoaderRef.current.eraseFlash()
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      espLoaderTerminal.writeLine(`Error: ${message}`);
      console.error(e)
    }
  }

  const preRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [terminalContents]);

  return <Form className='mb-5'>

    <Row className='mb-3 align-items-center'>
      <Col>
        <h3>Flash ESP-FC firmware</h3>
        {connected ? <Alert variant='danger'>Disconnect from the flight controller before flashing new firmware!</Alert> : null}
      </Col>
    </Row>

    <Row>
      <Col>
        <Card>
          <Card.Header>Flash Firmware</Card.Header>
          <Card.Body>

            <Card.Title className="mb-3">Step 1: connect to board</Card.Title>
            <p>Connect board to your computer and click "Connect".</p>
            <div className="d-flex border-bottom pb-3 mb-3">
              <div>
                <Form.Select style={{ width: 'auto' }} onChange={e => setBaudRate(+e.target.value)} value={baudRate} disabled={isConnected !== 'disconnected'}>
                  {baudRates.map(rate => <option key={rate} value={rate}>{rate}</option>)}
                </Form.Select>
              </div>
              <div className='ms-auto d-flex align-items-center gap-1'>
                {isConnected === 'detecting' ? <div className='pt-2 me-2 d-inline'><Spinner animation="border" variant="primary" className="" /></div> : null}
                <Button onClick={boardRestart} className='me-2' variant="outline-warning">Restart</Button>
                {isConnected === 'disconnected' ? <Button onClick={boardConnect} className=''>Connect</Button> : null}
                {isConnected !== 'disconnected' ? <Button onClick={boardDisconnect} className='' variant='danger'>Disconnect</Button> : null}
              </div>
            </div>

            <Card.Title className="mb-3">Step 2: Choose firmware</Card.Title>
            <Form.Select className="mb-3" onChange={(e) => { setBoard(e.target.value) }} value={board} disabled={isConnected !== 'disconnected'}>
              {boards.map((name) => <option value={name}>{name}</option>)}
            </Form.Select>
            <Form.Select className="mb-3" onChange={(e) => { setFwType(e.target.value) }} value={fwType}>
              {types.map(({ id, name }) => <option value={id}>{name}</option>)}
            </Form.Select>
            <Form.Select className="mb-3" onChange={(e) => setFwIndex(+e.target.value)} value={fwIndex}>
              {firmwares
                .map((e, i) => ({ ...e, index: i }))
                .filter(i => (i.board === board && i.group == fwType) || i.board === 'ALL')
                .map(({ board, version, index }) => <option key={index} value={index}>{board === 'ALL' ? version : `[${board}] - ${version}`}</option>)}
            </Form.Select>
            <Form.Control type="file" ref={fileInputRef} className='mb-3' disabled={!isLocalIndex()} />
            <div className="d-flex border-bottom mb-3"></div>

            <Card.Title className="mb-3">Step 3: Flash firmware</Card.Title>
            <p>To upload selected firmware click "Flash firmware" and power cycle board after flashing</p>
            <ProgressBar now={progress} label={`${progress.toFixed(0)}%`} className="mb-3" />
            <div className="d-flex mt-3">
              <div className='ms-auto'>
                <Button onClick={boardRead} className='me-2' disabled={isConnected !== 'connected'}>Read</Button>
                <Button onClick={boardErase} className='me-2' disabled={isConnected !== 'connected'}>Erase</Button>
                <Button onClick={boardFlash} className='' variant="warning" disabled={isConnected !== 'connected'}>Flash firmware</Button>
              </div>
            </div>

          </Card.Body>
          <Card.Footer className="text-danger">Warning: Flashing firmware will erase all data on the flight controller!</Card.Footer>
        </Card>
      </Col>
      <Col>
        <Card className='mb-3'>
          <Card.Header>Board Info</Card.Header>
          <Card.Body>
            {isConnected ?
              <>
                <p><strong>Board:</strong> {board}, <strong>Flash Size:</strong> {formatFlashSize(boardFlashSize)} </p>
                <p><strong>Features:</strong> {boardFeatures}</p>
              </> :
              <p>No board connected</p>}
          </Card.Body>
        </Card>
        <Card className='mb-3'>
          <Card.Header>Firmware Info</Card.Header>
          <Card.Body>
            {isLocalIndex() && fileInputRef.current?.files?.[0] ?
              <p>Local firmware selected</p> :
              (fwIndex && firmwares[fwIndex] ?
                <>
                  <p><strong>Board:</strong>&nbsp;{firmwares[fwIndex].board}, <strong>Version:</strong>&nbsp;
                  {firmwares[fwIndex].url ?
                    <a href={firmwares[fwIndex].url} target="_blank" rel="noreferrer">{firmwares[fwIndex].version}</a> :
                    <span>{firmwares[fwIndex].version}</span>
                  }</p>
                  {firmwares[fwIndex].file ? <p><strong>File:</strong> <a href={getFwUrl(firmwares[fwIndex])} target="_blank" rel="noreferrer">{firmwares[fwIndex].file}</a></p> : null}
                </> :
                <p>No firmware selected</p>)}
          </Card.Body>
        </Card>
        <pre style={preStyle} ref={preRef}>
          {terminalContents}
        </pre>
      </Col>
    </Row>

  </Form >
}

export default FlashTab