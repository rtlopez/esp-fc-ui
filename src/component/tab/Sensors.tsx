import { useCallback, useEffect } from 'react'
import { MspCommand } from '@/api/msp/msp'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createAccelConfigRequest, createGyroConfigRequest, createRebootRequest, createSaveRequest,
  createSensorConfigRequest, parseAccelConfigResponse, parseGyroConfigResponse, parseSensorConfigResponse
} from '@/api/esp'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'

type FormLpf = {
  type: number
  freq: number
}

type FormValues = {
  val: number
  loopSync: number
  accelDev: number
  magDev: number
  baroDev: number
  gyroAlign: number
  gyroLpf0: FormLpf
  gyroLpf1: FormLpf
  gyroLpf2: FormLpf
  dynNotch: {
    count: number
    q: number
    minFreq: number
    maxFreq: number
  }
  rpmNotch: {
    harmonics: number
    q: number
    minFreq: number
  }
  accelLpf: FormLpf
}

const INPUT_DEFAULTS = {
  val: 0,
  loopSync: 1,
  accelDev: 1,
  magDev: 1,
  baroDev: 1,
}

const deviceModes = [
  { id: 0, name: "Autodetect" },
  { id: 1, name: "None" },
]

const alignmentTypes = [
  { id: 0, name: "Default" },
  { id: 1, name: "0 Deg" },
  { id: 2, name: "90 Deg" },
  { id: 3, name: "180 Deg" },
  { id: 4, name: "270 Deg" },
  { id: 5, name: "0 Deg Flip" },
  { id: 6, name: "90 Deg Flip" },
  { id: 7, name: "180 Deg Flip" },
  { id: 8, name: "270 Deg Flip" },
]

const filterTypes = [
  { id: 0, name: "PT1" },
  { id: 1, name: "Biquad" },
  { id: 2, name: "PT2" },
  { id: 3, name: "PT3" },
  { id: 4, name: "Notch" },
  { id: 5, name: "Notch DF1" },
  { id: 6, name: "Band Pass" },
  { id: 7, name: "First Order" },
  { id: 8, name: "FIR2" },
  { id: 9, name: "Median 3" },
  { id: 10, name: "None" },
]

const SensorsTab = () => {

  const { connected, writeMsp, subscribeMsp } = useMsp()

  const {
    //control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: INPUT_DEFAULTS
  });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_SENSOR_CONFIG)) {
        const v = parseSensorConfigResponse(msg)
        reset({ ...getValues(), ...v })
        console.log("recv", v)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_GYRO_CONFIG)) {
        const v = parseGyroConfigResponse(msg)
        reset({
          ...getValues(),
          gyroAlign: v.align,
          gyroLpf0: { type: v.lpf[0].type, freq: v.lpf[0].freq },
          gyroLpf1: { type: v.lpf[1].type, freq: v.lpf[1].freq },
          gyroLpf2: { type: v.lpf[2].type, freq: v.lpf[2].freq },
          dynNotch: { ...v.dynNotch },
          rpmNotch: { ...v.rpmNotch },
        })
        console.log("recv", v)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_ACCEL_CONFIG)) {
        const v = parseAccelConfigResponse(msg)
        reset({ ...getValues(), accelLpf: { type: v.lpf.type, freq: v.lpf.freq } })
        console.log("recv", v)
      }
    })
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    writeMsp(createSensorConfigRequest({
      loopSync: data.loopSync,
      accelDev: data.accelDev,
      baroDev: data.baroDev,
      magDev: data.magDev,
    }))
    writeMsp(createGyroConfigRequest({
      align: data.gyroAlign,
      lpf: [
        { type: data.gyroLpf0.type, freq: data.gyroLpf0.freq },
        { type: data.gyroLpf1.type, freq: data.gyroLpf1.freq },
        { type: data.gyroLpf2.type, freq: data.gyroLpf2.freq },
      ],
      dynNotch: {
        count: data.dynNotch.count,
        q: data.dynNotch.q,
        minFreq: data.dynNotch.minFreq,
        maxFreq: data.dynNotch.maxFreq,
      },
      rpmNotch: {
        harmonics: data.rpmNotch.harmonics,
        q: data.rpmNotch.q,
        minFreq: data.rpmNotch.minFreq,
      }
    }))
    writeMsp(createAccelConfigRequest({
      lpf: {
        type: data.accelLpf.type,
        freq: data.accelLpf.freq
      }
    }))
    writeMsp(createSaveRequest())
    writeMsp(createRebootRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createSensorConfigRequest())
    writeMsp(createGyroConfigRequest())
    writeMsp(createAccelConfigRequest())
  }, [writeMsp])

  useEffect(() => {
    if (!connected) reset(INPUT_DEFAULTS);
    else onLoad();
  }, [connected, reset, onLoad]);

  return <TabView title='Sensors' reboot onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col md={6} className="mb-3">
        <Card>
          <Card.Header>Gyroscope</Card.Header>
          <Card.Body>

            <FormItem id="gyroAlign" label="Alignment">
              <Form.Select {...register("gyroAlign")} >
                {alignmentTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>


            <FormItem id="gyroLpf0.type" label="Filter 1 Type">
              <Form.Select {...register("gyroLpf0.type")}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="gyroLpf0.freq" label="Filter 1 Cut-off">
              <Form.Control type="number" {...register("gyroLpf0.freq", { valueAsNumber: true })} />
            </FormItem>


            <FormItem id="gyroLpf1.type" label="Filter 2 Type">
              <Form.Select {...register("gyroLpf1.type")}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="gyroLpf1.freq" label="Filter 2 Cut-off">
              <Form.Control type="number" {...register("gyroLpf1.freq", { valueAsNumber: true })} />
            </FormItem>


            <FormItem id="gyroLpf2.type" label="Decimator Type">
              <Form.Select {...register("gyroLpf2.type")}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="gyroLpf2.freq" label="Decimator Cut-off">
              <Form.Control type="number" {...register("gyroLpf2.freq", { valueAsNumber: true })} />
            </FormItem>


            <FormItem id="dynNotch.count" label="Dyn Notch Count">
              <Form.Control type="number" {...register("dynNotch.count", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="dynNotch.q" label="Dyn Notch Q Factor">
              <Form.Control type="number" step={0.1} {...register("dynNotch.q", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="dynNotch.minFreq" label="Dyn Notch Min Frequency">
              <Form.Control type="number" step={10} {...register("dynNotch.minFreq", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="dynNotch.maxFreq" label="Dyn Notch Max Frequency">
              <Form.Control type="number" step={10} {...register("dynNotch.maxFreq", { valueAsNumber: true })} />
            </FormItem>


            <FormItem id="rpmNotch.harmonics" label="Rpm Notch Harmonics">
              <Form.Control type="number" min={1} max={3} {...register("rpmNotch.harmonics", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="rpmNotch.q" label="Rpm Notch Q Factor">
              <Form.Control type="number" step={0.1} {...register("rpmNotch.q", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="rpmNotch.minFreq" label="Rpm Notch Min Frequency">
              <Form.Control type="number" {...register("rpmNotch.minFreq", { valueAsNumber: true })} />
            </FormItem>

          </Card.Body>
        </Card>
      </Col>

      <Col md={6} className="mb-3">
        <Card>
          <Card.Header>Accelerometer</Card.Header>
          <Card.Body>
            <FormItem id="accelDev" label="Accelerometer">
              <Form.Select {...register("accelDev", { valueAsNumber: true })}>
                {deviceModes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="accel.lpfType" label="Filter Type">
              <Form.Select {...register("accelLpf.type", { valueAsNumber: true })}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="accel.lpfFreq" label="Filter Cut-off">
              <Form.Control {...register("accelLpf.freq", { valueAsNumber: true })} />
            </FormItem>

          </Card.Body>
        </Card>
      </Col>

      <Col md={6} className="mb-3">
        <Card>
          <Card.Header>Barometer</Card.Header>
          <Card.Body>
            <FormItem id="baroDev" label="Barometer">
              <Form.Select {...register("baroDev", { valueAsNumber: true })}>
                {deviceModes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6} className="mb-3">
        <Card>
          <Card.Header>Magnetometer</Card.Header>
          <Card.Body>
            <FormItem id="magDev" label="Magnetometer">
              <Form.Select {...register("magDev", { valueAsNumber: true })}>
                {deviceModes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default SensorsTab