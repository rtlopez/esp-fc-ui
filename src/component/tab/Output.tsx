import { useCallback, useEffect } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import { MspCommand } from '@/api/msp/msp'
import {
  createOutputChannelConfigRequest, createOutputConfigRequest,
  createRebootRequest, createSaveRequest, EspOutputChannelConfigRequest,
  EspOutputChannelConfigResponse, EspOutputConfigResponse,
  parseOutputChannelConfigResponse, parseOutputConfigResponse
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
  outputChannels: Array<FormOutputChannel>
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
    { min: 1000, neutral: 1500, max: 2000, servo: false, reverse: false },
  ]
}

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

  const { connected, writeMsp, subscribeMsp } = useMsp()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: OUTPUT_DFAULTS
  });

  const { fields: outputChannels } = useFieldArray({
    control,
    name: "outputChannels",
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    const c = configFormToApi(data)
    const v = configChannelsFormToApi(data)
    writeMsp(createOutputConfigRequest(c))
    writeMsp(createOutputChannelConfigRequest(v))
    writeMsp(createSaveRequest())
    writeMsp(createRebootRequest())
  }

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_OUTPUT_CONFIG)) {
        const v = parseOutputConfigResponse(msg)
        const d = configApiToForm(v)
        reset({ ...getValues(), ...d })
        console.log("recv", v, d)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_OUTPUT_CHANNEL_CONFIG)) {
        const v = parseOutputChannelConfigResponse(msg)
        const d = configChannelsApiToForm(v)
        reset({ ...getValues(), ...d })
        console.log("recv", v, d)
      }
    })
  })

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createOutputConfigRequest())
    writeMsp(createOutputChannelConfigRequest())
  }, [writeMsp])

  useEffect(() => {
    if (!connected) reset(OUTPUT_DFAULTS)
    else onLoad();
  }, [connected, reset, onLoad])

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
      <Col>
        <Card className='mt-3'>
          <Card.Header>Motor Test (DANGER ZONE)</Card.Header>
          <Card.Body>
            <Form.Group as={Row} controlId="motorTest" className="mb-3">
              <Col>
                <Form.Switch />
              </Col>
              <Form.Label column sm={11}><strong>I Understand a Risk</strong></Form.Label>
            </Form.Group>
            {[1, 2, 3, 4].map(motor => {
              return <Form.Group key={motor} as={Row} controlId={`motor_${motor}`} className="mb-3">
                <Form.Label column>{`M${motor}`}</Form.Label>
                <Col sm={11}>
                  <Form.Range min={0} max={100} step={1} defaultValue={0} />
                </Col>
              </Form.Group>
            })}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </TabView>
}

export default OutputTab