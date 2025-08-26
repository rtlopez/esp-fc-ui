import { useCallback, useEffect, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { MspCommand } from '@/api/msp/msp'
import { createPidTuningRequest, createSaveRequest, parsePidTuningResponse } from '@/api/esp'
import { Card, Col, Row, Form } from 'react-bootstrap'
import TabView from './TabView'

type AxisNamesType = "roll" | "pitch" | "yaw"
type PidNamesType = "p" | "i" | "d" | "f"

const AxisNames: AxisNamesType[] = ['roll', 'pitch', 'yaw']
const PidNames: PidNamesType[] = ['p', 'i', 'd', 'f']

type FormPidValues = {
  p: number
  i: number
  d: number
  f: number
}

type FormValues = {
  mode: number
  rpGain: number
  rpStability: number
  rpAgility: number
  rpBalance: number
  yawGain: number
  yawStability: number
  pids: FormPidValues[]
}

const PID_TUNING_DEFAULTS: FormValues = {
  mode: 0,
  rpGain: 100,
  rpStability: 100,
  rpAgility: 100,
  rpBalance: 100,
  yawGain: 100,
  yawStability: 100,
  pids: [
    { p: 80, i: 80, d: 80, f: 80 },
    { p: 80, i: 80, d: 80, f: 80 },
    { p: 80, i: 80, d: 80, f: 80 },
  ]
}

const TuningTab = () => {

  const [rollRate, setRollRate] = useState(240)
  const [pitchRate, setPitchRate] = useState(240)
  const [yawRate, setYawRate] = useState(320)

  const { connected, writeMsp, subscribeMsp } = useMsp()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    watch,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: PID_TUNING_DEFAULTS
  });

  const { fields: pidValues } = useFieldArray({ control, name: "pids", });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_SAVE)) {
        console.log("saved")
      }
      if (msg.isCmd(MspCommand.ESP_CMD_PID_TUNING)) {
        const v = parsePidTuningResponse(msg)
        reset({ ...getValues(), ...v })
        console.log("recv", v)
      }
    })
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    writeMsp(createPidTuningRequest({
      mode: data.mode,
      rpGain: data.rpGain,
      rpStability: data.rpStability,
      rpAgility: data.rpAgility,
      rpBalance: data.rpBalance,
      yawGain: data.yawGain,
      yawStability: data.yawStability,
      pids: data.pids,
    }))
    writeMsp(createSaveRequest())
    //writeMsp(createRebootRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createPidTuningRequest())
  }, [writeMsp])

  useEffect(() => {
    if (!connected) reset(PID_TUNING_DEFAULTS);
    else onLoad();
  }, [connected, reset, onLoad]);

  const rpGain = watch("rpGain")
  const rpStability = watch("rpStability")
  const rpAgility = watch("rpAgility")
  const rpBalance = watch("rpBalance")
  const yawGain = watch("yawGain")
  const yawStability = watch("yawStability")

  return <TabView title='Tuning' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Tuning</span>
            <Form.Switch label="Manual" {...register("mode")} />
          </Card.Header>
          <Card.Body>
            <Row>
              <Form.Group as={Col} controlId="rpGain" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll/Pitch Gain
                  <span>{rpGain}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} {...register("rpGain")} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="rpStability" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll/Pitch Stability
                  <span>{rpStability}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} {...register("rpStability")} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="rpAgility" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll/Pitch Agility
                  <span>{rpAgility}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} {...register("rpAgility")} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="rpBalance" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll/Pitch Balance
                  <span>{rpBalance}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} {...register("rpBalance")} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="yawGain" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Yaw Gain
                  <span>{yawGain}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} {...register("yawGain")} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="yawStability" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Yaw Stability
                  <span>{yawStability}%</span>
                </Form.Label>
                <Form.Range min={0} max={200} step={10} {...register("yawStability")} />
              </Form.Group>
            </Row>

          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>Rates</Card.Header>
          <Card.Body>
            <Row>
              <Form.Group as={Col} controlId="rollRate" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll Rate
                  <span>{rollRate} deg/s</span>
                </Form.Label>
                <Form.Range min={30} max={1800} step={10} value={rollRate} onChange={(e) => {
                  setRollRate(+e.target.value)
                }} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="pitchRate" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Pitch Rate
                  <span>{pitchRate} deg/s</span>
                </Form.Label>
                <Form.Range min={30} max={1800} step={10} value={pitchRate} onChange={(e) => {
                  setPitchRate(+e.target.value)
                }} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="yawRate" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Yaw Rate
                  <span>{yawRate} deg/s</span>
                </Form.Label>
                <Form.Range min={30} max={1800} step={10} value={yawRate} onChange={(e) => {
                  setYawRate(+e.target.value)
                }} />
              </Form.Group>
            </Row>
          </Card.Body>
        </Card>

      </Col>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>PIDS</Card.Header>
          <Card.Body>
            <Row key={'h'} className="mb-2">
              {['Axis', 'P', 'I', 'D', 'F'].map(col => (
                <Col key={col} className="text-center">
                  <strong>{col}</strong>
                </Col>
              ))}
            </Row>
            {pidValues.map((_out, i) => {
              return <Row key={_out.id} className="mb-2">
                <Col key={'label'}>
                  {AxisNames[i]}
                </Col>
                {PidNames.map(col => (
                  <Col key={col}>
                    <Form.Control type="number" {...register(`pids.${i}.${col}`)} />
                  </Col>
                ))}
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default TuningTab