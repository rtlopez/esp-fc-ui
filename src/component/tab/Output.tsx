import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Card, Col, Form, ProgressBar, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import { MspCommand } from '@/api/msp/msp'
import {
  createOutputChannelConfigRequest, createOutputConfigRequest,
  createOutputOverrideRequest, createOutputRequest, createRebootRequest,
  createSaveRequest, EspOutputChannelConfigRequest, EspOutputChannelConfigResponse,
  EspOutputConfigResponse, parseOutputChannelConfigResponse, parseOutputConfigResponse,
  parseOutputResponse
} from '@/api/esp'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'

type FormOutputChannel = {
  min: number
  neutral: number
  max: number
  servo: boolean
  reverse: boolean
}

type FormValues = {
  protocol: number
  async: boolean
  rate: number
  servoRate: number
  minCommand: number
  minThrottle: number
  maxThrottle: number
  digitalIdle: number
  digitalTlm: boolean
  motorPoles: number
  motorLimit: number
  throttleLimitType: number
  throttleLimitPercent: number
  outputCount: number
  outputChannels: FormOutputChannel[]
}

const OUTPUT_DFAULTS: FormValues = {
  protocol: 0,
  async: false,
  rate: 480,
  servoRate: 50,
  minCommand: 1000,
  minThrottle: 1070,
  maxThrottle: 2000,
  digitalIdle: 5.5,
  digitalTlm: false,
  motorPoles: 14,
  motorLimit: 100,
  throttleLimitType: 0,
  throttleLimitPercent: 100,
  outputCount: 4,
  outputChannels: [
    { min: 1000, neutral: 1500, max: 2000, servo: false, reverse: false },
    { min: 1000, neutral: 1500, max: 2000, servo: false, reverse: false },
    { min: 1000, neutral: 1500, max: 2000, servo: false, reverse: false },
    { min: 1000, neutral: 1500, max: 2000, servo: true, reverse: false },
  ],
}

const OUTPUT_VALUE_DEFAULTS = [1000, 1000, 1000, 1500]

const motorProtocols = [
  { id: 9, name: 'Disabled' },
  { id: 0, name: 'PWM' },
  { id: 1, name: 'OneShot 125' },
  { id: 2, name: 'OneShot 42' },
  { id: 3, name: 'MultiShot' },
  { id: 4, name: 'Brushed' },
  { id: 5, name: 'Dshot 150' },
  { id: 6, name: 'Dshot 300' },
  { id: 7, name: 'Dshot 600' },
]

const configFormToApi = (f: FormValues): EspOutputConfigResponse => {
  return {
    protocol: f.protocol,
    async: f.async,
    rate: f.rate,
    servoRate: f.servoRate,
    minCommand: f.minCommand,
    minThrottle: f.minThrottle,
    maxThrottle: f.maxThrottle,
    digitalIdle: f.digitalIdle,
    digitalTlm: f.digitalTlm,
    motorPoles: f.motorPoles,
    motorLimit: f.motorLimit,
    throttleLimitType: f.throttleLimitType,
    throttleLimitPercent: f.throttleLimitPercent,
  }
}

const configApiToForm = (v: EspOutputConfigResponse) => {
  return {
    protocol: v.protocol,
    async: v.async,
    rate: v.rate,
    servoRate: v.servoRate,
    minCommand: v.minCommand,
    minThrottle: v.minThrottle,
    maxThrottle: v.maxThrottle,
    digitalIdle: v.digitalIdle,
    digitalTlm: v.digitalTlm,
    motorPoles: v.motorPoles,
    motorLimit: v.motorLimit,
    throttleLimitType: v.throttleLimitType,
    throttleLimitPercent: v.throttleLimitPercent,
  }
}

const configChannelsFormToApi = (fv: FormValues): EspOutputChannelConfigRequest => {
  return {
    count: fv.outputChannels.length,
    channels: fv.outputChannels.map(f => ({
      min: f.min,
      neutral: f.neutral,
      max: f.max,
      servo: f.servo,
      reverse: f.reverse,
    }))
  }
}

const configChannelsApiToForm = (v: EspOutputChannelConfigResponse) => {
  return {
    outputCount: v.count,
    outputChannels: v.channels,
  }
}

const OutputTab = () => {

  const { connected, writeMsp, subscribeMsp, useIntervalMsp } = useMsp()
  const [outputValues, setOutputValues] = useState(OUTPUT_VALUE_DEFAULTS)
  const [outputOverrides, setOutputOverrides] = useState(OUTPUT_VALUE_DEFAULTS)
  const [outputOverride, setOutputOverride] = useState(false)
  const [outputOverrideAllMotors, setOutputOverrideAllMotors] = useState(1000)

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    watch,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: OUTPUT_DFAULTS
  });

  const [outputCount] = watch(['outputCount'])
  const { fields: outputChannels } = useFieldArray({ control, name: "outputChannels" });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_OUTPUT_CONFIG)) {
        const v = parseOutputConfigResponse(msg)
        const d = configApiToForm(v)
        reset({ ...getValues(), ...d })
      }
      if (msg.isCmd(MspCommand.ESP_CMD_OUTPUT_CHANNEL_CONFIG)) {
        const v = parseOutputChannelConfigResponse(msg)
        const d = configChannelsApiToForm(v)
        reset({ ...getValues(), ...d })
        if (!outputOverride) {
          setOutputOverrides(v.channels.map(e => e.servo ? e.neutral : getValues().minCommand))
        }
      }
      if (msg.isCmd(MspCommand.ESP_CMD_OUTPUT)) {
        const v = parseOutputResponse(msg)
        setOutputValues(v.channels)
      }
    })
  }, [outputOverride, reset, getValues, setOutputValues, subscribeMsp])

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    const c = configFormToApi(data)
    const v = configChannelsFormToApi(data)
    writeMsp(createOutputConfigRequest(c))
    writeMsp(createOutputChannelConfigRequest(v))
    writeMsp(createSaveRequest())
    writeMsp(createRebootRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createOutputConfigRequest())
    writeMsp(createOutputChannelConfigRequest())
  }, [writeMsp])

  const onReset = useCallback(() => {
    reset(OUTPUT_DFAULTS)
    setOutputOverrideAllMotors(1000)
    setOutputOverrides(OUTPUT_VALUE_DEFAULTS)
    setOutputValues(OUTPUT_VALUE_DEFAULTS)
    setOutputOverride(false)
  }, [reset])

  useEffect(() => {
    if (!connected) onReset()
    else onLoad();
  }, [connected, onReset, onLoad])

  // poll some msp messages
  useIntervalMsp(useCallback(() => {
    if (outputOverride) {
      writeMsp(createOutputOverrideRequest({ count: outputCount, values: outputOverrides }))
    }
    writeMsp(createOutputRequest())
  }, [outputOverride, outputCount, outputOverrides, writeMsp]), 200);

  // clear override sliders when turned off
  const prevOutputOverride = useRef(outputOverride);
  useEffect(() => {
    if (prevOutputOverride.current === true && outputOverride === false) {
      const values = getValues("outputChannels").map((c) => c.servo ? c.neutral : getValues().minCommand)
      writeMsp(createOutputOverrideRequest({ count: outputCount, values }))
      setOutputOverrides(values)
      setOutputOverrideAllMotors(getValues().minCommand)
    }
    prevOutputOverride.current = outputOverride;
  }, [outputOverride, outputCount, getValues, writeMsp])

  const createOverrideChangeHandler = useCallback((i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const copy = [...outputOverrides];
    copy[i] = +e.target.value;
    setOutputOverrides(copy);
  }, [outputOverrides]);

  const handleOverrideChangeAllMotors = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const motors = getValues("outputChannels").map((c) => !c.servo)
    const copy = motors.map((v, i) => v ? +e.target.value : outputOverrides[i]);
    setOutputOverrideAllMotors(+e.target.value)
    setOutputOverrides(copy)
  }, [outputOverrides, getValues])

  return <TabView title='Output' reboot onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>Motor Configuration</Card.Header>
          <Card.Body>

            <FormItem id="motorProtocol" label="Motor Protocol">
              <Form.Select {...register("protocol")}>
                {motorProtocols.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="dshotTelementry" label="Dshot Telemetry">
              <Form.Switch {...register("digitalTlm")} />
            </FormItem>

            <FormItem id="motorAsync" label="Async Output">
              <Form.Switch {...register("async")} />
            </FormItem>

            <FormItem id="motorAsyncRate" label="Async Refresh Rate">
              <Form.Control type='number' min={50} max={8000} {...register("rate")} />
            </FormItem>

            <FormItem id="motorOffCommand" label="Disarmed Command">
              <Form.Control type='number' min={990} max={2000} {...register("minCommand")} />
            </FormItem>

            <FormItem id="motorMinCommand" label="Minimum Command">
              <Form.Control type='number' min={990} max={2000} {...register("minThrottle")} />
            </FormItem>

            <FormItem id="motorMaxCommand" label="Maximum Command">
              <Form.Control type='number' min={990} max={2000} {...register("maxThrottle")} />
            </FormItem>

            <FormItem id="motorPoles" label="Motor Poles">
              <Form.Control type='number' min={0} max={64} step={2} {...register("motorPoles")} />
            </FormItem>

            <FormItem id="dshotIdle" label="Dshot Idle [%]">
              <Form.Control type='number' min={0} max={20} step={0.05} {...register("digitalIdle")} />
            </FormItem>

            <FormItem id="motorLimit" label="Motor Limit [%]">
              <Form.Control type='number' min={0} max={100} {...register("motorLimit")} />
            </FormItem>

          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Throttle Configuration</Card.Header>
          <Card.Body>

            <FormItem id="throttleLimitType" label="Throttle Limit Type">
              <Form.Select {...register("throttleLimitType")} >
                <option value={0}>None</option>
                <option value={1}>Scale</option>
                <option value={2}>Clip</option>
              </Form.Select>
            </FormItem>

            <FormItem id="throttleLimitPercent" label="Throttle Limit [%]">
              <Form.Control type='number' min={0} max={100} {...register("throttleLimitPercent")} />
            </FormItem>

          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>

        <Card className='mb-3'>
          <Card.Header>Output Configuration</Card.Header>
          <Card.Body>
            <Row className='mb-3'>
              <Col>Output</Col>
              <Col>Servo</Col>
              <Col>Reverse</Col>
              <Col>Minimum</Col>
              <Col>Neutral</Col>
              <Col>Maximum</Col>
            </Row>
            {outputChannels.map((_out, i) => {
              return <Row key={i}>
                <Col>
                  {`${i + 1}`}
                </Col>
                <Form.Group as={Col} controlId={`out_servo_${i}`} className="mb-3">
                  <Form.Switch {...register(`outputChannels.${i}.servo`)} />
                </Form.Group>
                <Form.Group as={Col} controlId={`out_rev_${i}`} className="mb-3">
                  <Form.Switch {...register(`outputChannels.${i}.reverse`)} />
                </Form.Group>
                <Form.Group as={Col} controlId={`out_min_${i}`} className="mb-3">
                  <Form.Control type='number' min={1000} max={2000} {...register(`outputChannels.${i}.min`, { valueAsNumber: true })} />
                </Form.Group>
                <Form.Group as={Col} controlId={`out_neutral_${i}`} className="mb-3">
                  <Form.Control type='number' min={1000} max={2000} {...register(`outputChannels.${i}.neutral`, { valueAsNumber: true })} />
                </Form.Group>
                <Form.Group as={Col} controlId={`out_max_${i}`} className="mb-3">
                  <Form.Control type='number' min={1000} max={2000} {...register(`outputChannels.${i}.max`, { valueAsNumber: true })} />
                </Form.Group>
              </Row>
            })}
          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Servo Configuration</Card.Header>
          <Card.Body>

            <FormItem id="servoRate" label="Servo Refresh Rate">
              <Form.Control type='number' min={0} max={333} {...register("servoRate")} />
            </FormItem>

          </Card.Body>
        </Card>
      </Col>

    </Row>
    <Row>
      <Col md={6}>
        <Card className='mt-3'>
          <Card.Header className="d-flex justify-content-between align-items-center">
            Output Test (DANGER ZONE)
            <Form.Switch label="I Understand a Risk" checked={outputOverride} onChange={(e) => setOutputOverride(e.target.checked)} disabled={!connected} />
          </Card.Header>
          <Card.Body>
            <Form.Group as={Row} controlId={`motor_all`} className="mb-3 border-bottom pb-2">
              <Col sm={1}>
                <Form.Label>{`M@`}</Form.Label>
              </Col>
              <Col sm={10}>
                <Form.Range min={1000} max={2000} step={1} value={outputOverrideAllMotors} disabled={!outputOverride} onChange={handleOverrideChangeAllMotors} />
              </Col>
              <Col sm={1}>
                {outputOverrideAllMotors}
              </Col>
            </Form.Group>
            {outputOverrides.map((v, i) => {
              return <Form.Group key={i} as={Row} controlId={`motor_${i}`} className="mb-2">
                <Col sm={1}>
                  <Form.Label>{`${outputChannels[i]?.servo ? 'S' : 'M'}${i + 1}`}</Form.Label>
                </Col>
                <Col sm={10}>
                  <Form.Range min={1000} max={2000} step={1} disabled={!outputOverride} value={outputOverrides[i]} onChange={createOverrideChangeHandler(i)} />
                </Col>
                <Col sm={1}>
                  {v}
                </Col>
              </Form.Group>
            })}
          </Card.Body>
        </Card>
      </Col>
      <Col md={6}>
        <Card className='mt-3'>
          <Card.Header>Output Status</Card.Header>
          <Card.Body>
            <Row className='mb-3 border-bottom pb-3'>
              <Col xs={2}>Output</Col>
              <Col xs={10}>Actual Value</Col>
            </Row>
            {outputValues.map((v, i) => {
              return <Row key={i} className="mb-3">
                <Col xs={2}>
                  {`${outputChannels[i]?.servo ? 'S' : 'M'}${i + 1}`}
                </Col>
                <Col xs={10}>
                  <ProgressBar key={i} now={v} label={`${v}`} min={1000} max={2000} animated={false} striped={false} />
                </Col>
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </TabView>
}

export default OutputTab