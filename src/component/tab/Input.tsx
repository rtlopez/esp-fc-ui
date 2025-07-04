import { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createInputChannelConfigRequest, createInputConfigRequest,
  createInputRequest, createSaveRequest, EspInputResponse,
  parseInputChannelConfigResponse, parseInputConfigResponse,
  parseInputResponse
} from '@/api/esp'
import { Card, Col, Form, ProgressBar, Row } from 'react-bootstrap'
import { RcControls } from '@/component/widget'
import TabView from './TabView'
import { MspCommand } from '@/api/msp/msp'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form';

const channelMaping: Record<number, string> = {
  0: "Roll",
  1: "Pitch",
  2: "Yaw",
  3: "Throttle",
}

const inputTypes = [
  { id: 0, name: 'Choose...' },
  { id: 1, name: 'Serial - IBUS' },
  { id: 2, name: 'Serial - SBUS' },
  { id: 3, name: 'Serial - CRSF/ELRS' },
  { id: 10, name: 'Esp Now' },
  { id: 11, name: 'PPM' },
]

type FormChannel = {
  map: number
  min: number
  max: number
  fsMode: number
  fsValue: number
}

type FormValues = {
  inputType: number
  inputDeadband: number
  inputMin: number
  inputMid: number
  inputMax: number
  channels: Array<FormChannel>
}

type FormItemProps = {
  label: string
  id: string
} & PropsWithChildren

const FormItem: React.FC<FormItemProps> = ({ label, id, children }) => {
  return <Form.Group as={Row} className="mb-3" controlId={id}>
    <Form.Label column>{label}</Form.Label>
    <Col sm={6}>
      {children}
    </Col>
  </Form.Group>
}

const InputTab = () => {

  const [inputs, setInputs] = useState<EspInputResponse>({ count: 8, channels: [1500, 1500, 1500, 1000, 1500, 1500, 1500, 1500] })
  const { connected, writeMsp, subscribeMsp } = useMsp()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      inputType: 0,
      inputDeadband: 2,
      inputMin: 880,
      inputMid: 1500,
      inputMax: 2200,
      channels: []
    }
  });

  const { fields: channels } = useFieldArray({
    control,
    name: "channels",
  });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_SAVE)) {
        console.log("saved")
      }
      if (msg.isCmd(MspCommand.ESP_CMD_INPUT)) {
        setInputs(parseInputResponse(msg))
      }
      if (msg.isCmd(MspCommand.ESP_CMD_INPUT_CONFIG)) {
        const v = parseInputConfigResponse(msg)
        const data = {
          inputType: v.type,
          inputDeadband: v.deadband,
          inputMin: v.min,
          inputMid: v.mid,
          inputMax: v.max,
        }
        reset({ ...getValues(), ...data })
        console.log("recv", v, data)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_INPUT_CHANNEL_CONFIG)) {
        const v = parseInputChannelConfigResponse(msg)
        const channels = v.channels
        reset({ ...getValues(), channels })
        console.log("recv", v, channels)
      }
    })
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    const v = {
      type: data.inputType,
      deadband: data.inputDeadband,
      min: data.inputMin,
      mid: data.inputMid,
      max: data.inputMax,
      dbg: 0
    }
    const c = {
      count: 0,
      channels: data.channels
    }
    writeMsp(createInputConfigRequest(v))
    writeMsp(createInputChannelConfigRequest(c))
    writeMsp(createSaveRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createInputConfigRequest())
    writeMsp(createInputChannelConfigRequest())
  }, [writeMsp])

  useEffect(() => {
    if (!connected) return;
    else onLoad();
    const interval = setInterval(() => {
      writeMsp(createInputRequest())
    }, 300);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected, writeMsp, onLoad]);

  return <TabView title='Input' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col lg={6}>
        <Card className="mb-2">
          <Card.Header>Options</Card.Header>
          <Card.Body>

            <FormItem id="inputType" label="Receiver Type">
              <Form.Select {...register("inputType")}>
                {inputTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="inputMid" label="Center">
              <Form.Control type="number" {...register("inputMid")} />
            </FormItem>

            <FormItem id="inputDeadband" label="Deadband">
              <Form.Control type="number" {...register("inputDeadband")} />
            </FormItem>

            <FormItem id="inputMin" label="Valid Minimum">
              <Form.Control type="number" {...register("inputMin")} />
            </FormItem>

            <FormItem id="inputMax" label="Valid Maximum">
              <Form.Control type="number" {...register("inputMax")} />
            </FormItem>

          </Card.Body>
        </Card>

        <Card className="mb-2">
          <Card.Header>Advanced</Card.Header>
          <Card.Body>

            <Row className='mb-3'>
              <Col>Channel</Col>
              <Col>Map</Col>
              <Col>Min</Col>
              <Col>Max</Col>
              <Col>FsMode</Col>
              <Col>FsValue</Col>
            </Row>
            {channels.map((_ch, i) => {
              return <Row key={i}>
                <Col>
                  {`CH${i + 1}`}
                </Col>
                <Form.Group as={Col} controlId={`ch_map_${i}`} className="mb-3">
                  <Form.Control type='number' min={0} max={15} {...register(`channels.${i}.map`, { valueAsNumber: true })} />
                </Form.Group >
                <Form.Group as={Col} controlId={`ch_min_${i}`} className="mb-3">
                  <Form.Control type='number' min={1000} max={2000} {...register(`channels.${i}.min`, { valueAsNumber: true })} />
                </Form.Group>
                <Form.Group as={Col} controlId={`ch_max_${i}`} className="mb-3">
                  <Form.Control type='number' min={1000} max={2000} {...register(`channels.${i}.max`, { valueAsNumber: true })} />
                </Form.Group>
                <Form.Group as={Col} controlId={`ch_fsm_${i}`} className="mb-3">
                  <Form.Select {...register(`channels.${i}.fsMode`, { valueAsNumber: true })}>
                    <option value="0">Auto</option>
                    <option value="1">Hold</option>
                    <option value="2">Set</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group as={Col} controlId={`ch_fsv_${i}`} className="mb-3">
                  <Form.Control type='number' min={1000} max={2000} {...register(`channels.${i}.fsValue`, { valueAsNumber: true })} />
                </Form.Group>
              </Row>
            })}

          </Card.Body>
        </Card>
      </Col>

      <Col lg={6}>

        <Card className="mb-2">
          <Card.Header>Sticks</Card.Header>
          <Card.Body className='d-flex justify-content-between align-items-start'>
            <RcControls w={170} h={170} px={0} py={-1} pr={10} />
            <RcControls w={170} h={170} px={0} py={0} pr={10} />
          </Card.Body>
        </Card>

        <Card className="mb-2">
          <Card.Header>Channel Monitor</Card.Header>
          <Card.Body>
            {inputs.channels.map((ch, i) => {
              return <Row key={i}>
                <Col xs={2}>
                  {channelMaping[i] ? channelMaping[i] : `CH${i + 1}`}
                </Col>
                <Col xs={10}>
                  {i < inputs.count ? <ProgressBar key={i} now={ch} label={`${ch}`} min={880} max={2120} animated={false} /> : null}
                </Col>
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={6}>
      </Col>

    </Row>
  </TabView >
}

export default InputTab
