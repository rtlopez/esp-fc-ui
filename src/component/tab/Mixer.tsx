import { FC, useCallback, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createMixerConfigRequest, createMixerNamesRequest, createSaveRequest,
  EspMixerConfig, EspNameElement, parseMixerConfigResponse, 
  parseMixerNamesResponse
} from '@/api/esp'
import { SubmitHandler, useForm, useWatch } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'

type FormValues = {
  mixerType: number
  yawReverse: boolean
  sync: number
}

const MIXER_DEFAULTS = {
  mixerType: 3,
  yawReverse: false,
  sync: 1
}

const MIXER_NAMES: EspNameElement[] = [
  { id: 3, name: "Quad X" },
  { id: 1, name: "Tricopter" },
  { id: 23, name: "Custom" },
]

type DronePreviewProps = {
  yawReverse: boolean
}

// 4 1
// 3 2
const MOTOR_POSITIONS = [
  { x: 75, y: 75, num: 1, rear: true,  left: false, ccw: false }, // Rear  Right
  { x: 75, y: 25, num: 2, rear: false, left: false, ccw: true  }, // Front Right
  { x: 25, y: 75, num: 3, rear: true,  left: true,  ccw: true  }, // Rear  Left
  { x: 25, y: 25, num: 4, rear: false, left: true,  ccw: false }, // Front Left
]

type MotorIndicatorProps = {
  cx: number
  cy: number
  r: number
  reversed: boolean
  ccw: boolean
  rear: boolean
  left: boolean
}

// Arrow path for rotation (clockwise)
const MotorIndicator: FC<MotorIndicatorProps> = ({ cx, cy, r, reversed, ccw, rear}) => {
  // Draw a circular arc with an arrowhead
  const dir = ccw !== reversed
  const angleOffset = ccw ? -25 : 25
  const angleFrom = angleOffset + (rear ? 0 : 180)
  const angleTo = angleFrom + (dir ? -25 : 25)
  const arrowSize = 5
  const arrowTip = {
    x: (cx + r * Math.sin((angleFrom * Math.PI) / 180)).toFixed(3),
    y: (cy + r * Math.cos((angleFrom * Math.PI) / 180)).toFixed(3),
  }
  const arrowEnd1 = {
    x: (cx + (r + arrowSize - 1) * Math.sin((angleTo * Math.PI) / 180)).toFixed(3),
    y: (cy + (r + arrowSize - 1) * Math.cos((angleTo * Math.PI) / 180)).toFixed(3),
  }
  const arrowEnd2 = {
    x: (cx + (r - arrowSize - 1) * Math.sin((angleTo * Math.PI) / 180)).toFixed(3),
    y: (cy + (r - arrowSize - 1) * Math.cos((angleTo * Math.PI) / 180)).toFixed(3),
  }

  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="transparent"
        stroke="#00af7b"
        strokeWidth="1"
      />
      <polygon
        points={`${arrowTip.x},${arrowTip.y} ${arrowEnd1.x},${arrowEnd1.y} ${arrowEnd2.x},${arrowEnd2.y}`}
        fill="#00af7b"
      />
    </>
  )
}

const DronePreview: FC<DronePreviewProps> = ({ yawReverse }) => {
  const numberOffset = [20, 20, -20, -20] // Adjust motor number position

  return (
    <svg width={200} height={200} viewBox="0 0 100 100">

      {/* Motors and arms */}
      {MOTOR_POSITIONS.map((pos, i) => (
        <g key={pos.num}>
          {/* Arms (X) */}
          <line x1={50} y1={50} x2={pos.x} y2={pos.y} stroke="#aaa" strokeWidth="4" />
          {/* Motor Number */}
          <text
            x={pos.x + numberOffset[i]}
            y={pos.y + 4}
            textAnchor="middle"
            fontSize="12"
            fill="#dc3545"
            fontWeight="bold"
          >
            {pos.num}
          </text>
          {/* Motor direction */}
          <MotorIndicator
            cx={pos.x}
            cy={pos.y}
            r={12}
            ccw={pos.ccw}
            rear={pos.rear}
            left={pos.left}
            reversed={yawReverse}
          />
        </g>
      ))}

      {/* Front indicator */}
      <polygon
        points="47,15 53,15 50,5"
        fill="#dc3545"
        opacity="0.7"
      />
      <text
        x={50}
        y={25}
        textAnchor="middle"
        fontSize="6"
        fill="#dc3545"
        fontWeight="bold"
      >
        FRONT
      </text>
    </svg>
  )
}

const MixerTab = () => {

  const [mixerNames, setMixerNames] = useState(MIXER_NAMES)
  const { send } = useMsp()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: MIXER_DEFAULTS
  });

  const updateMixerConfig = useCallback((v: EspMixerConfig) => {
    reset({ ...getValues(), ...v })
  }, [reset, getValues])

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
    console.log("save", data)
    updateMixerConfig(parseMixerConfigResponse(await send(createMixerConfigRequest(data))))
    await send(createSaveRequest())
  }, [send, updateMixerConfig])

  const onLoad = useCallback(async () => {
    console.log("load")
    setMixerNames(parseMixerNamesResponse(await send(createMixerNamesRequest())).names)
    updateMixerConfig(parseMixerConfigResponse(await send(createMixerConfigRequest())))
  }, [send, updateMixerConfig])

  const onReset = useCallback(() => {
    setMixerNames(MIXER_NAMES);
    reset(MIXER_DEFAULTS);
  }, [reset]);

  const yawReverse = useWatch({ control, name: 'yawReverse'})

  return <TabView title='Status' reboot onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>Mixer</Card.Header>
          <Card.Body>

            <FormItem id="mixerType" label="Mixer Type">
              <Form.Select {...register("mixerType")}>
                {mixerNames.map(({ id, name }) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </Form.Select>
            </FormItem>

            <FormItem id="yawReverse" label="Motor Reversed">
              <Form.Switch {...register("yawReverse")} />
            </FormItem>

            <FormItem id="sync" label="Mixer Sync">
              <Form.Control {...register("sync")} />
            </FormItem>

          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <Card.Header>Model Preview</Card.Header>
          <Card.Body>

            <Form.Group>
              <DronePreview yawReverse={yawReverse} />
            </Form.Group>

          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default MixerTab
