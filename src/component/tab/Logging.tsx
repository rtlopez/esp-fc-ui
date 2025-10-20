import { FC, useCallback, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Modal, ProgressBar, Row, Spinner, Table } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createBlackboxConfigRequest, createBlackboxNamesRequest, createDebugNamesRequest,
  createFlashEraseRequest, createFlashLogsRequest, createFlashReadRequest, createRebootRequest,
  createSaveRequest, EspFlashLogsItem, parseBlackboxConfigResponse, parseBlackboxNamesResponse,
  parseDebugNamesResponse, parseFlashLogsResponse, parseFlashReadResponse
} from '@/api/esp'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'
import { useBoardInfo } from '@/api/BoardInfoProvider'
import { useBlobAccumulator } from '@/api/hook/useBlobAccumulator'

const DNLD_SIZE = 160

type FormValues = {
  device: number
  denom: number
  mode: number
  fieldMask: number
  debugMode: number
  debugAxis: number
}

const LOGGING_DEFAULTS = {
  device: 0,
  denom: 1,
  mode: 0,
  fieldMask: 0xffff,
  debugMode: 0,
  debugAxis: 0,
}

const DEBUG_NAMES_DEFAULT = [
  { id: 0, name: "NONE" },
  { id: 1, name: "ACCEL" },
]

const FIELD_NAMES_DEFAULT = [
  { id: 0, name: "PID" },
  { id: 1, name: "SETPOINT" },
  { id: 2, name: "GYRO" },
]

const LOGS_DEFAULT: EspFlashLogsItem[] = []

const devices = [
  { id: 0, name: "None" },
  { id: 1, name: "Onboard Flash" },
  { id: 3, name: "Serial Port" },
]

const debugAxes = [
  { id: 0, name: "Roll" },
  { id: 1, name: "Pitch" },
  { id: 2, name: "Yaw" },
]

type ConfirmProps = {
  onConfirm: () => void
  onCancel: () => void
  show: boolean
}

const ConfirmModal: FC<ConfirmProps> = ({ show, onConfirm, onCancel }) => {
  return <Modal show={show} centered onHide={onCancel}>
    <Modal.Header closeButton>
      <Modal.Title>Warning</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      This operation will erase all blackbox data on flash memory.<br />
      All data will be lost.<br /><br />
      Would you like to continue?</Modal.Body>
    <Modal.Footer>
      <Button variant="outline-primary" onClick={onCancel}>No</Button>
      <Button variant="primary" onClick={onConfirm}>Yes</Button>
    </Modal.Footer>
  </Modal>
}

const LoggingTab = () => {

  const [debugNames, setDebugNames] = useState(DEBUG_NAMES_DEFAULT)
  const [fieldNames, setFieldNames] = useState(FIELD_NAMES_DEFAULT)
  const [inProgress, setInProgress] = useState(false)
  const [logs, setLogs] = useState(LOGS_DEFAULT)
  const [showConfirm, setShowConfirm] = useState(false);
  const [dnldPerc, setDnldPerc] = useState(0);
  const { connected, send } = useMsp()
  const { status, statistics } = useBoardInfo()
  const { append, finalize, clear, download, dateStr } = useBlobAccumulator("application/octet-stream")

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: LOGGING_DEFAULTS
  });

  const fieldMask = useWatch({ control, name: 'fieldMask' })

  const updateBlackboxConfig = useCallback(async (data?: FormValues) => {
    const r = await send(createBlackboxConfigRequest(data))
    const v = parseBlackboxConfigResponse(r)
    reset({ ...getValues(), ...v })
  }, [send, reset, getValues])

  const updateFlashLogs = useCallback(async () => {
    const r = await send(createFlashLogsRequest())
    const v = parseFlashLogsResponse(r)
    setLogs(v.logs)
  }, [send])

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
    await updateBlackboxConfig(data)
    await send(createSaveRequest())
    await send(createRebootRequest())
  }, [send, updateBlackboxConfig])

  const onLoad = useCallback(async () => {
    setDebugNames(parseDebugNamesResponse(await send(createDebugNamesRequest())).names)
    setFieldNames(parseBlackboxNamesResponse(await send(createBlackboxNamesRequest())).names)
    await updateBlackboxConfig()
    await updateFlashLogs()
  }, [send, updateBlackboxConfig, updateFlashLogs]);

  const onReset = useCallback(() => {
    setDebugNames(DEBUG_NAMES_DEFAULT)
    setFieldNames(FIELD_NAMES_DEFAULT)
    setLogs(LOGS_DEFAULT)
    reset(LOGGING_DEFAULTS)
  }, [reset]);

  const denomItems = useMemo(() => {
    const loopFreq = 1000000 / (status?.loopTimeUs || 1000)
    const result = []
    for (let i = 0; i < 5; i++) {
      const freq = Math.round(loopFreq / 2 ** i)
      result.push({ id: i, name: `[1:${2 ** i}] ${freq} Hz` })
    }
    return result
  }, [status?.loopTimeUs])

  const flashUsage = Math.round(statistics && statistics.flashTotal ? (100 * statistics.flashUsed / statistics.flashTotal) : 100)

  const flashErase = () => {
    setShowConfirm(true)
  }

  const flashEraseConfirm = async () => {
    setInProgress(true)
    setShowConfirm(false)
    await send(createFlashEraseRequest())
    setInProgress(false)
  }

  const flashEraseCancel = () => {
    setShowConfirm(false)
  }

  const flashRead = async () => {
    if (statistics && statistics.flashUsed) {
      setInProgress(true)
      while (true) {
        const r = await send(createFlashReadRequest({ address: 0, size: DNLD_SIZE }))
        const v = parseFlashReadResponse(r)

        // append data chunk
        append(new Uint8Array(v.data))
        
        // calc next chunk address
        const address = v.address + v.size
        const size = Math.min(DNLD_SIZE, statistics.flashUsed - address)
        console.log("next", { address, size, total: statistics.flashUsed })

        // calc dnld proggress
        const dnldProgress = Math.round(100 * v.address / statistics.flashUsed)
        if (dnldPerc !== dnldProgress) {
          setDnldPerc(dnldProgress)
        }
        
        // finish reading
        if (!size || address >= statistics.flashUsed) {
          console.log("finish")
          setInProgress(false)
          const blob = finalize()
          clear()
          download(blob, `espfc_log_${dateStr()}.bbl`)
          setDnldPerc(0)
          break
        }
      }
    } else {
      console.log('flash epmty')
    }
  }

  return <TabView title='Logging' reboot onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col md={6}>
        <Card className="mb-3">
          <Card.Header>Configuration</Card.Header>
          <Card.Body>
            <FormItem id="device" label="Device">
              <Form.Select {...register("device")} >
                {devices.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="denom" label="Rate">
              <Form.Select {...register("denom")} >
                {denomItems.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="debugMode" label="Debug Mode">
              <Form.Select {...register("debugMode")} >
                {debugNames.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="debugAxis" label="Debug Axis">
              <Form.Select {...register("debugAxis")} >
                {debugAxes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>Onboard Flash</Card.Header>
          <Card.Body>
            <ProgressBar>
              <ProgressBar variant="warning" min={0} max={100} now={flashUsage} label={`${flashUsage}%`} />
              <ProgressBar variant="success" min={0} max={100} now={100 - flashUsage} label={`${100 - flashUsage}%`} />
            </ProgressBar>

            <Col className="d-flex justify-content-end mt-3">
              {inProgress ? <Spinner animation="border" variant="primary" className="me-3" /> : null}
              <Button variant="outline-primary" className="me-2" disabled={!connected || inProgress} onClick={flashErase}>
                Erase Flash
              </Button>
              <Button disabled={!connected || inProgress} onClick={flashRead}>
                Download Log{inProgress ? ` (${dnldPerc}%)` : ''}
              </Button>
              <ConfirmModal show={showConfirm} onConfirm={flashEraseConfirm} onCancel={flashEraseCancel} />
            </Col>

            {logs.length ? <Table striped hover>
              <thead>
                <tr>
                  <th>Num</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  return <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{(log.size / 1000).toFixed(1)} kB</td>
                  </tr>
                })}
              </tbody>
            </Table> : null}

          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card className="mb-3">
          <Card.Header>Logged Fields</Card.Header>
          <Card.Body>
            {fieldNames.map(({ id, name }) => {
              return <Form.Switch
                id={`field_mask_${id}`}
                key={id}
                label={name}
                checked={(fieldMask & (1 << id)) !== 0}
                onChange={(e) => {
                  const mask = e.target.checked ? (fieldMask | (1 << id)) : (fieldMask & ~(1 << id))
                  reset({ ...getValues(), fieldMask: mask })
                }}
              />
            })}
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default LoggingTab