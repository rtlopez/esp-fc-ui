import { useCallback, useEffect, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import { MspCommand } from '@/api/msp/msp'
import {
  createMixerConfigRequest, createMixerNamesRequest, createSaveRequest,
  EspNameElement, parseMixerConfigResponse, parseMixerNamesResponse
} from '@/api/esp'
import { SubmitHandler, useForm } from 'react-hook-form'
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

const MixerTab = () => {

  const [mixerNames, setMixerNames] = useState(MIXER_NAMES)
  const { connected, writeMsp, subscribeMsp } = useMsp()

  const {
    //control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: MIXER_DEFAULTS
  });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_SAVE)) {
        console.log("saved")
      }
      if (msg.isCmd(MspCommand.ESP_CMD_MIXER_NAMES)) {
        const v = parseMixerNamesResponse(msg)
        setMixerNames(v.names)
        console.log("recv", v)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_MIXER_CONFIG)) {
        const v = parseMixerConfigResponse(msg)
        reset({ ...getValues(), ...v })
        console.log("recv", v)
      }
    })
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    writeMsp(createMixerConfigRequest(data))
    writeMsp(createSaveRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createMixerNamesRequest())
    writeMsp(createMixerConfigRequest())
  }, [writeMsp])

  useEffect(() => {
    if (!connected) { setMixerNames(MIXER_NAMES); reset(MIXER_DEFAULTS); }
    else onLoad();
  }, [connected, reset, onLoad]);

  return <TabView title='Status' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
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
          <Card.Header>Preview</Card.Header>
          <Card.Body>
            Model preview
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default MixerTab
