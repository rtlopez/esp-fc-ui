import { useCallback, useMemo, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import { useBoardInfo } from '@/api/BoardInfoProvider'
import {
  createFeaturesConfigRequest, createFeaturesNamesRequest, createRebootRequest,
  createSaveRequest, createSensorConfigRequest, createSerialConfigRequest,
  createSerialNamesRequest, EspFeaturesConfig, EspSensorConfigResponse,
  EspSerialConfigResponse, parseFeaturesConfigResponse, parseFeaturesNamesResponse,
  parseSensorConfigResponse, parseSerialConfigResponse, parseSerialNamesResponse
} from '@/api/esp'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'

type FormSerialConfig = {
  baud: number
  func: number
}

type FormValues = {
  serialCount: number
  serialPorts: FormSerialConfig[],
  features: boolean[]
  loopSync: number
  accelDev: number
  magDev: number
  baroDev: number
  alignment: number[]
}

const CONFIG_DEFAULTS = {
  serialCount: 0,
  serialPorts: [
    { baud: 115200, func: 0 }, // USB
    { baud: 115200, func: 0 }, // UART1
    { baud: 115200, func: 0 }, // UART2
    { baud: 115200, func: 0 }, // WIFI
  ],
  features: Array(32).fill(false),
  loopSync: 1,
  accelDev: 1,
  magDev: 1,
  baroDev: 1,
  alignment: [0, 0, 0],
}

const CONFIG_DEFAULT_SERIAL_NAMES = [
  { id: 0, name: "USB" },
  { id: 1, name: "UART1" },
  { id: 2, name: "UART2" },
  { id: 3, name: "WIFI" },
]

const CONFIG_DEFAULT_FEATURE_NAMES = [
  { id: 6, name: "WIFI" },
  { id: 7, name: "GPS" },
  { id: 10, name: "TELEMETRY" },
]

const serialBauds = [9600, 19200, 57600, 115200, 230400, 250000, 460800, 500000, 921600, 1000000]

const serialFunctions = [
  { id: 0, name: "None" },
  { id: 1 << 0, name: "Msp" },
  { id: 1 << 1, name: "Gps" },
  { id: 1 << 6, name: "Serial RX" },
  { id: 1 << 7, name: "Blackbox" },
  { id: 1 << 11, name: "VTX SmartAudio" },
  { id: 1 << 13, name: "VTX Tramp" },
]

const ConfigurationTab = () => {

  const [serialNames, setSerialNames] = useState(CONFIG_DEFAULT_SERIAL_NAMES)
  const [featureNames, setFeatureNames] = useState(CONFIG_DEFAULT_FEATURE_NAMES)
  const { send } = useMsp()
  const { status } = useBoardInfo()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: CONFIG_DEFAULTS
  });

  const { fields: serialPorts } = useFieldArray({ control, name: "serialPorts" });

  const updateSerialPorts = useCallback((v: EspSerialConfigResponse) => {
    const serial = {
      serialCount: v.count,
      serialPorts: v.configs.map((c) => ({
        baud: c.baud,
        func: c.func
      }))
    }
    reset({ ...getValues(), ...serial })
  }, [reset, getValues])

  const updateSensors = useCallback((v: EspSensorConfigResponse) => {
    reset({ ...getValues(), ...v })
  }, [reset, getValues])

  const updateFeatures = useCallback((v: EspFeaturesConfig) => {
    const features = []
    for (let i = 0; i < 32; i++) {
      features[i] = !!(v.features & (1 << i))
    }
    reset({ ...getValues(), features })
  }, [reset, getValues])

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    console.log("save", data)
    updateSensors(parseSensorConfigResponse(await send(createSensorConfigRequest(data))))
    updateSerialPorts(parseSerialConfigResponse(await send(createSerialConfigRequest({
      count: data.serialCount,
      configs: data.serialPorts.map((port) => ({
        baud: port.baud,
        func: port.func,
      }))
    }))))
    updateFeatures(parseFeaturesConfigResponse(await send(createFeaturesConfigRequest({
      features: data.features.reduce((acc, v, i) => acc | (v ? (1 << i) : 0), 0)
    }))))
    await send(createSaveRequest())
    await send(createRebootRequest())
  }

  const onLoad = useCallback(async () => {
    console.log("load")
    setSerialNames(parseSerialNamesResponse(await send(createSerialNamesRequest())).names)
    setFeatureNames(parseFeaturesNamesResponse(await send(createFeaturesNamesRequest())).names)
    updateSensors(parseSensorConfigResponse(await send(createSensorConfigRequest())))
    updateSerialPorts(parseSerialConfigResponse(await send(createSerialConfigRequest())))
    updateFeatures(parseFeaturesConfigResponse(await send(createFeaturesConfigRequest())))
  }, [send, updateSerialPorts, updateSensors, updateFeatures])

  const onReset = useCallback(() => {
    reset(CONFIG_DEFAULTS)
  }, [reset])

  const loopSyncItems = useMemo(() => {
    const gyroFreq = 1000000 / (status?.gyroTimeUs || 500)
    const result = []
    for (let i = 1; i <= 8; i++) {
      const freq = Math.round(gyroFreq / i)
      if (freq < 500) break
      result.push({ id: i, name: `[1:${i}] ${freq} Hz` })
    }
    return result
  }, [status?.gyroTimeUs])

  return <TabView title='Configuration' reboot onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>System</Card.Header>
          <Card.Body>

            <FormItem id="loopSync" label="PID Rate">
              <Form.Select {...register("loopSync", { valueAsNumber: true })}>
                {loopSyncItems.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Features</Card.Header>
          <Card.Body>
            {Array.from({ length: 32 }).map((_, id) => {
              const featureName = featureNames.find(f => f.id == id)?.name
              return featureName ? <Form.Group key={id} as={Col} controlId={`feature_${id}`} className="mb-3">
                <Form.Switch {...register(`features.${id}`)} label={featureName} />
              </Form.Group> : null
            })}
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>Serial Ports</Card.Header>
          <Card.Body>
            <Row className='mb-3'>
              <Col>Port</Col>
              <Col>Function</Col>
              <Col>Speed</Col>
            </Row>
            {serialPorts.map((_port, i) => {
              return <Row key={i}>
                <Col>
                  {serialNames.find(s => s.id == i)?.name || `Port ${i}`}
                </Col>
                <Form.Group as={Col} controlId={`serial_func_${i}`} className="mb-3">
                  <Form.Select {...register(`serialPorts.${i}.func`)}>
                    {serialFunctions.map(f => <option value={f.id} key={f.id}>{f.name}</option>)}
                  </Form.Select>
                </Form.Group>
                <Form.Group as={Col} controlId={`serial_baud_${i}`} className="mb-3">
                  <Form.Select {...register(`serialPorts.${i}.baud`)}>
                    {serialBauds.map(baud => <option key={baud} value={baud}>{baud.toLocaleString()}</option>)}
                  </Form.Select>
                </Form.Group>
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default ConfigurationTab
