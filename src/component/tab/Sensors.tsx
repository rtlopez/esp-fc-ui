import { useCallback, useEffect } from 'react'
import { MspCommand } from '@/api/msp/msp'
import { useMsp } from '@/api/msp/MspProvider'
import { createRebootRequest, createSaveRequest, createSensorConfigRequest, parseSensorConfigResponse } from '@/api/esp'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'

type FormValues = {
  val: number
  loopSync: number
  accelDev: number
  magDev: number
  baroDev: number
}

const INPUT_DEFAULTS = {
  val: 0,
  loopSync: 1,
  accelDev: 1,
  magDev: 1,
  baroDev: 1,
}

const deviceMode = [
  { id: 0, name: "Autodetect" },
  { id: 1, name: "None" }
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
    writeMsp(createSaveRequest())
    writeMsp(createRebootRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createSensorConfigRequest())
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
            <FormItem id="val" label="LPF cutoff">
              <Form.Control type="number" min={0} max={250} {...register("val")} />
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
                {deviceMode.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
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
                {deviceMode.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
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
                {deviceMode.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </Form.Select>
            </FormItem>
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default SensorsTab