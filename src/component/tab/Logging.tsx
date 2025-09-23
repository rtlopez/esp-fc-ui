import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import { MspCommand } from '@/api/msp/msp'
import {
  createBlackboxConfigRequest, createBlackboxNamesRequest, createDebugNamesRequest,
  createRebootRequest, createSaveRequest, parseBlackboxConfigResponse,
  parseBlackboxNamesResponse, parseDebugNamesResponse
} from '@/api/esp'
import { SubmitHandler, useForm } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'
import { useBoardinfo } from '@/api/BoardInfoProvider'

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

const LoggingTab = () => {

  const [debugNames, setDebugNames] = useState(DEBUG_NAMES_DEFAULT)
  const [fieldNames, setFieldNames] = useState(FIELD_NAMES_DEFAULT)
  const { connected, writeMsp, subscribeMsp } = useMsp()
  const { status } = useBoardinfo()

  const {
    //control,
    register,
    handleSubmit,
    reset,
    getValues,
    watch,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: LOGGING_DEFAULTS
  });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_DEBUG_NAMES)) {
        setDebugNames(parseDebugNamesResponse(msg).names)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_BLACKBOX_NAMES)) {
        setFieldNames(parseBlackboxNamesResponse(msg).names)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_BLACKBOX_CONFIG)) {
        const v = parseBlackboxConfigResponse(msg)
        reset({ ...getValues(), ...v })
        console.log("recv", v)
      }
    })
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    writeMsp(createBlackboxConfigRequest(data))
    writeMsp(createSaveRequest())
    writeMsp(createRebootRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createDebugNamesRequest())
    writeMsp(createBlackboxNamesRequest())
    writeMsp(createBlackboxConfigRequest())
  }, [writeMsp])

  useEffect(() => {
    if (!connected) {
      setDebugNames(DEBUG_NAMES_DEFAULT)
      setFieldNames(FIELD_NAMES_DEFAULT)
      reset(LOGGING_DEFAULTS);
    } else onLoad();
  }, [connected, reset, onLoad]);

  const denomItems = useMemo(() => {
    const loopFreq = 1000000 / (status?.loopTimeUs || 1000)
    const result = []
    for (let i = 1; i <= 32; i++) {
      const freq = Math.round(loopFreq / i)
      result.push({ id: i, name: `[${i}] ${freq} Hz` })
    }
    return result
  }, [status?.loopTimeUs])

  return <TabView title='Logging' reboot onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col md={6}>
        <Card>
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
      </Col>

      <Col md={6}>
        <Card>
          <Card.Header>Logged Fields</Card.Header>
          <Card.Body>
            {fieldNames.map(({ id, name }) => {
              const fieldMask = watch('fieldMask')
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