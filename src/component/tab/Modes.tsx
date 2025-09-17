import { useCallback, useEffect, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import { MspCommand } from '@/api/msp/msp'
import {
  createModeNamesRequest, createModesConfigRequest, createSaveRequest,
  parseModeNamesResponse, parseModesConfigResponse
} from '@/api/esp'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import TabView from './TabView'

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
    { id: 1, ch: 4, min: 1300, max: 2100 },
    { id: 2, ch: 5, min: 900, max: 1700 },
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

const ModesTab = () => {

  const [modeNames, setModeNames] = useState(MODE_NAMES_DEFAULT)
  const { connected, writeMsp, subscribeMsp } = useMsp()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: MODES_DEFAULTS
  });

  const { fields: modes } = useFieldArray({ control, name: "modes" });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_MODE_NAMES)) {
        const v = parseModeNamesResponse(msg)
        setModeNames([{ id: 0xff, name: "- None -" }, ...v.names])
        console.log("recv", v)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_MODES_CONFIG)) {
        const v = parseModesConfigResponse(msg)
        reset({ ...getValues(), ...v })
        console.log("recv", v)
      }
    })
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    writeMsp(createModesConfigRequest({
      modeCount: data.modeCount,
      modes: data.modes,
    }))
    writeMsp(createSaveRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createModeNamesRequest())
    writeMsp(createModesConfigRequest())
  }, [writeMsp])

  useEffect(() => {
    if (!connected) {
      reset(MODES_DEFAULTS);
      setModeNames(MODE_NAMES_DEFAULT)
    }
    else onLoad();
  }, [connected, reset, onLoad]);

  return <TabView title='Modes' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col>
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>

            <Row className='mb-3'>
              <Col>Channel</Col>
              <Col>Min</Col>
              <Col>Max</Col>
              <Col>Mode</Col>
            </Row>
            {modes.map((_m, i) => {
              return <Row key={i}>
                <Form.Group as={Col} controlId={`mode_ch_${i}`} className="mb-3">
                  <Form.Select id={`mode_ch_${i}`} {...register(`modes.${i}.ch`)}>
                    {channelNames.map(({ id, name }) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
                  </Form.Select>
                </Form.Group >
                <Form.Group as={Col} controlId={`mode_min_${i}`} className="mb-3">
                  <Form.Control type='number' min={900} max={2100} step={25} {...register(`modes.${i}.min`, { valueAsNumber: true })} />
                </Form.Group>
                <Form.Group as={Col} controlId={`mode_max_${i}`}className="mb-3">
                  <Form.Control type='number' min={900} max={2100} step={25} {...register(`modes.${i}.max`, { valueAsNumber: true })} />
                </Form.Group>
                <Form.Group as={Col} controlId={`mode_id_${i}`} className="mb-3">
                  <Form.Select {...register(`modes.${i}.id`)}>
                    {modeNames.map(({ id, name }) => (
                      <option key={id} value={id}>{name}</option>
                    ))}
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

export default ModesTab