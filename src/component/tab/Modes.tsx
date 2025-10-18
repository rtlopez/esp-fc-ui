import { useCallback, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createInputRequest, createModeNamesRequest, createModesConfigRequest,
  createSaveRequest, EspInputResponse, EspModesConfig, parseInputResponse,
  parseModeNamesResponse, parseModesConfigResponse
} from '@/api/esp'
import { SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form'
import TabView from './TabView'
import Slider from "rc-slider"
import 'rc-slider/assets/index.css'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'

// https://www.npmjs.com/package/rc-slider?activeTab=readme

type FormMode = {
  id: number
  ch: number
  min: number
  max: number
}

type FormValues = {
  modeCount: number
  modes: FormMode[]
}

const MODES_DEFAULTS: FormValues = {
  modeCount: 2,
  modes: [
    { id: 1, ch: 4, min: 1650, max: 2100 },
    { id: 2, ch: 5, min: 900, max: 1350 },
    { id: 0xff, ch: 0xff, min: 900, max: 900 },
  ]
}

const MODE_NAMES_DEFAULT = [
  { id: 0xff, name: "- NONE -" },
  { id: 1, name: "ARM" },
  { id: 2, name: "ANGLE" },
]

const channelNames = [
  { id: 0xff, name: "- None -" },
  { id: 4, name: "CH5" },
  { id: 5, name: "CH6" },
  { id: 6, name: "CH7" },
  { id: 7, name: "CH8" },
  { id: 8, name: "CH9" },
  { id: 9, name: "CH10" },
  { id: 10, name: "CH11" },
  { id: 11, name: "CH12" },
  { id: 12, name: "CH13" },
  { id: 13, name: "CH14" },
  { id: 14, name: "CH15" },
  { id: 15, name: "CH16" },
]

type Mark = {
  style?: React.CSSProperties;
  label?: React.ReactNode;
}

const marks = [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000].reduce((acc, i) => {
  acc[i] = {
    style: { fontWeight: i % 500 ? "normal" : "bold" },
    label: `${i}`,
  }
  return acc
}, {} as Record<number, Mark>)

const ModesTab = () => {

  const [modeNames, setModeNames] = useState(MODE_NAMES_DEFAULT)
  const [inputs, setInputs] = useState<EspInputResponse>({ count: 8, channels: [1500, 1500, 1500, 1000, 1500, 1500, 1500, 1500] })
  const { send } = useMsp()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: MODES_DEFAULTS
  });

  const { fields: modes } = useFieldArray({ control, name: 'modes' })
  const watchModes = useWatch({ control, name: 'modes' })

  const updateModesConfig = useCallback((v: EspModesConfig) => {
    reset({ ...getValues(), ...v })
  }, [reset, getValues])

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
    updateModesConfig(parseModesConfigResponse(await send(createModesConfigRequest({
      modeCount: data.modeCount,
      modes: data.modes,
    }))))
    await send(createSaveRequest())
  }, [send, updateModesConfig])

  const onLoad = useCallback(async () => {
    setModeNames([{ id: 0xff, name: "- None -" }, ...parseModeNamesResponse(await send(createModeNamesRequest())).names])
    updateModesConfig(parseModesConfigResponse(await send(createModesConfigRequest())))
  }, [send, updateModesConfig])

  const onReset = useCallback(() => {
    reset(MODES_DEFAULTS);
    setModeNames(MODE_NAMES_DEFAULT)
  }, [reset]);

  useIntervalMsp(useCallback(async () => {
    setInputs(parseInputResponse(await send(createInputRequest())))
  }, [send]), 350)

  return <TabView title='Modes' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col>
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>

            <Row className='mb-3'>
              <Col md={1}>Channel</Col>
              <Col md={8} className="text-center">Range</Col>
              <Col md={2}>Mode</Col>
              <Col md={1}>Status</Col>
            </Row>
            {modes.map((_, i) => {
              const ch = watchModes[i].ch
              const min = watchModes[i].min
              const max = watchModes[i].max
              let chValue = ch !== 0xff && ch < inputs.count ? inputs.channels[ch] : 900
              if (chValue % 100 === 0) chValue += 1 // to show the pointer on the slider
              const inRange = chValue >= min && chValue <= max
              if (chValue < 900) chValue = 900
              if (chValue > 2100) chValue = 2100
              const onSliderChange = (val: number | number[]) => {
                if (Array.isArray(val)) {
                  setValue(`modes.${i}.min`, val[0])
                  setValue(`modes.${i}.max`, val[1])
                }
              }

              return <Row key={i} className="border-top mt-2 pt-4">

                <Col md={1}>
                  <Form.Group controlId={`mode_ch_${i}`} className="mb-3">
                    <Form.Select id={`mode_ch_${i}`} {...register(`modes.${i}.ch`)}>
                      {channelNames.map(({ id, name }) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group >
                </Col>

                <Col md={8} className='mt-2'>
                  <Slider
                    range={{ draggableTrack: true }}
                    min={900}
                    max={2100}
                    step={25}
                    value={[min, max]}
                    onChange={onSliderChange}
                    allowCross={true}
                    pushable={false}
                    marks={{
                      ...marks,
                      [chValue]: { style: { color: "orange", fontWeight: "bold" }, label: '⇧' },
                    }}
                    styles={{
                      track: { backgroundColor: '#0d6efd', height: 6, top: 4 },
                      rail: { backgroundColor: 'lightgray', height: 2, top: 6 },
                    }}
                    dotStyle={{ borderColor: 'lightgray', height: 6, width: 6, bottom: -1 }}
                    activeDotStyle={{ borderColor: '#0d6efd', height: 8, width: 8, bottom: -2 }}
                  />
                </Col>

                <Col md={2}>
                  <Form.Group controlId={`mode_id_${i}`} className="mb-3">
                    <Form.Select {...register(`modes.${i}.id`)}>
                      {modeNames.map(({ id, name }) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={1}>
                  {inRange ?
                    <i className="bi bi-check-square" style={{ fontSize: "1.6em" }}></i> :
                    <i className="bi bi-square" style={{ fontSize: "1.6em", color: "darkgray" }}></i>
                  }
                </Col>
              </Row>
            })}

          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default ModesTab
