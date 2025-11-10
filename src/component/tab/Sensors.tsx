import { useCallback } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createAccelConfigRequest, createBaroConfigRequest, createGyroConfigRequest,
  createMagConfigRequest, createRebootRequest, createSaveRequest,
  createSensorConfigRequest, EspAccelConfig, EspBaroConfig, EspGyroConfig,
  EspMagConfig, EspSensorConfigResponse, parseAccelConfigResponse,
  parseBaroConfigResponse, parseGyroConfigResponse, parseMagConfigResponse,
  parseSensorConfigResponse
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
  alignment: number[]
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
  baroLpf: FormLpf
  magAlign: number
  magLpf: FormLpf
}

const SENSOR_DEFAULTS = {
  val: 0,
  loopSync: 1,
  accelDev: 1,
  magDev: 1,
  baroDev: 1,
  gyroAlign: 0,
  gyroLpf0: { type: 0, freq: 100 },
  gyroLpf1: { type: 0, freq: 213 },
  gyroLpf2: { type: 7, freq: 150 },
  dynNotch: { count: 3, q: 3.0, minFreq: 80, maxFreq: 400 },
  rpmNotch: { harmonics: 3, q: 5.0, minFreq: 100 },
  accelLpf: { type: 1, freq: 15 },
  baroLpf: { type: 1, freq: 3 },
  magAlign: 0,
  magLpf: { type: 0, freq: 10 },
  alignment: [0, 0, 0],
}

const deviceModes = [
  { id: 0, name: "Autodetect" },
  { id: 1, name: "Disabled" },
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

const axes = [
  { id: 0, name: "Roll" },
  { id: 1, name: "Pitch" },
  { id: 2, name: "Yaw" },
]

const SensorsTab = () => {

  const { send } = useMsp()

  const {
    //control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: SENSOR_DEFAULTS
  });

  const updateSensorConfig = useCallback((v: EspSensorConfigResponse) => {
    reset({ ...getValues(), ...v })
  }, [reset, getValues])

  const updateGyroConfig = useCallback((v: EspGyroConfig) => {
    reset({
      ...getValues(),
      gyroAlign: v.align,
      gyroLpf0: { type: v.lpf[0].type, freq: v.lpf[0].freq },
      gyroLpf1: { type: v.lpf[1].type, freq: v.lpf[1].freq },
      gyroLpf2: { type: v.lpf[2].type, freq: v.lpf[2].freq },
      dynNotch: { ...v.dynNotch },
      rpmNotch: { ...v.rpmNotch },
    })
  }, [reset, getValues])

  const updateAccelConfig = useCallback((v: EspAccelConfig) => {
    reset({ ...getValues(), ...{ accelLpf: { type: v.lpf.type, freq: v.lpf.freq } } })
  }, [reset, getValues])

  const updateBaroConfig = useCallback((v: EspBaroConfig) => {
    reset({ ...getValues(), ...{ baroLpf: { type: v.lpf.type, freq: v.lpf.freq } } })
  }, [reset, getValues])

  const updateMagConfig = useCallback((v: EspMagConfig) => {
    reset({ ...getValues(), ...{ magAlign: v.align, magLpf: { type: v.lpf.type, freq: v.lpf.freq } } })
  }, [reset, getValues])

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
    updateSensorConfig(parseSensorConfigResponse(await send(createSensorConfigRequest(data))))
    updateGyroConfig(parseGyroConfigResponse(await send(createGyroConfigRequest({
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
    }))))
    updateAccelConfig(parseAccelConfigResponse(await send(createAccelConfigRequest({
      lpf: {
        type: data.accelLpf.type,
        freq: data.accelLpf.freq
      }
    }))))
    updateBaroConfig(parseBaroConfigResponse(await send(createBaroConfigRequest({
      lpf: {
        type: data.baroLpf.type,
        freq: data.baroLpf.freq
      }
    }))))
    updateMagConfig(parseMagConfigResponse(await send(createMagConfigRequest({
      align: data.magAlign,
      lpf: {
        type: data.magLpf.type,
        freq: data.magLpf.freq
      }
    }))))
    await send(createSaveRequest())
    await send(createRebootRequest())
  }, [send, updateSensorConfig, updateGyroConfig, updateAccelConfig, updateBaroConfig, updateMagConfig])

  const onLoad = useCallback(async () => {
    updateSensorConfig(parseSensorConfigResponse(await send(createSensorConfigRequest())))
    updateGyroConfig(parseGyroConfigResponse(await send(createGyroConfigRequest())))
    updateAccelConfig(parseAccelConfigResponse(await send(createAccelConfigRequest())))
    updateBaroConfig(parseBaroConfigResponse(await send(createBaroConfigRequest())))
    updateMagConfig(parseMagConfigResponse(await send(createMagConfigRequest())))
  }, [send, updateSensorConfig, updateGyroConfig, updateAccelConfig, updateMagConfig, updateBaroConfig])

  const onReset = useCallback(() => {
    reset(SENSOR_DEFAULTS);
  }, [reset]);

  return <TabView title='Sensors' reboot onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>Board Orientation</Card.Header>
          <Card.Body>
            {axes.map(({ id, name }) => {
              return <FormItem key={id} id={`alignment_${id}`} label={`${name} [°]`}>
                <Form.Control type="number" min={-180} max={180} step={1} {...register(`alignment.${id}`)} />
              </FormItem>
            })}
          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Gyroscope</Card.Header>
          <Card.Body>
            <FormItem id="gyroAlign" label="Alignment">
              <Form.Select {...register("gyroAlign")} >
                {alignmentTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Gyroscope Low-Pass Filter</Card.Header>
          <Card.Body>
            <FormItem id="gyroLpf0.type" label="Filter 1 Type">
              <Form.Select {...register("gyroLpf0.type")}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
            <FormItem id="gyroLpf0.freq" label="Filter 1 Cut-off">
              <Form.Control type="number" step={1} min={0} max={500} {...register("gyroLpf0.freq", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="gyroLpf1.type" label="Filter 2 Type">
              <Form.Select {...register("gyroLpf1.type")}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="gyroLpf1.freq" label="Filter 2 Cut-off">
              <Form.Control type="number" step={1} min={0} max={500} {...register("gyroLpf1.freq", { valueAsNumber: true })} />
            </FormItem>


            <FormItem id="gyroLpf2.type" label="Decimator Type">
              <Form.Select {...register("gyroLpf2.type")}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>

            <FormItem id="gyroLpf2.freq" label="Decimator Cut-off">
              <Form.Control type="number" step={1} min={0} max={500} {...register("gyroLpf2.freq", { valueAsNumber: true })} />
            </FormItem>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>Gyroscope Dyn-Notch Filter</Card.Header>
          <Card.Body>
            <FormItem id="dynNotch.count" label="Count">
              <Form.Control type="number" step={1} min={0} max={6} {...register("dynNotch.count", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="dynNotch.q" label="Q Factor">
              <Form.Control type="number" step={0.1} min={0} max={5} {...register("dynNotch.q", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="dynNotch.minFreq" label="Min Frequency">
              <Form.Control type="number" step={1} min={50} max={200} {...register("dynNotch.minFreq", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="dynNotch.maxFreq" label="Max Frequency">
              <Form.Control type="number" step={1} min={150} max={500} {...register("dynNotch.maxFreq", { valueAsNumber: true })} />
            </FormItem>
          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Gyroscope RPM-Notch Filter</Card.Header>
          <Card.Body>
            <FormItem id="rpmNotch.harmonics" label="Harmonics">
              <Form.Control type="number" step={1} min={1} max={3} {...register("rpmNotch.harmonics", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="rpmNotch.q" label="Q Factor">
              <Form.Control type="number" step={0.1} min={0} max={6} {...register("rpmNotch.q", { valueAsNumber: true })} />
            </FormItem>

            <FormItem id="rpmNotch.minFreq" label="Min Frequency">
              <Form.Control type="number" step={1} min={50} max={200} {...register("rpmNotch.minFreq", { valueAsNumber: true })} />
            </FormItem>

          </Card.Body>
        </Card>

        <Card className="mb-3">
          <Card.Header>Accelerometer</Card.Header>
          <Card.Body>
            <FormItem id="accelDev" label="Device">
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

      <Col md={6}>
        <Card className="mb-3">
          <Card.Header>Barometer</Card.Header>
          <Card.Body>
            <FormItem id="baroDev" label="Device">
              <Form.Select {...register("baroDev", { valueAsNumber: true })}>
                {deviceModes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
            <FormItem id="baroLpf.type" label="Filter Type">
              <Form.Select {...register("baroLpf.type")}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
            <FormItem id="baroLpf.freq" label="Filter Cut-off">
              <Form.Control type="number" step={1} min={0} max={25} {...register("baroLpf.freq", { valueAsNumber: true })} />
            </FormItem>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card className="mb-3">
          <Card.Header>Magnetometer</Card.Header>
          <Card.Body>
            <FormItem id="magDev" label="Device">
              <Form.Select {...register("magDev", { valueAsNumber: true })}>
                {deviceModes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
            <FormItem id="magAlign" label="Alignment">
              <Form.Select {...register("magAlign")} >
                {alignmentTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
            <FormItem id="magLpf.type" label="Filter Type">
              <Form.Select {...register("magLpf.type")}>
                {filterTypes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
            <FormItem id="magLpf.freq" label="Filter Cut-off">
              <Form.Control type="number" step={1} min={0} max={25} {...register("magLpf.freq", { valueAsNumber: true })} />
            </FormItem>
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default SensorsTab