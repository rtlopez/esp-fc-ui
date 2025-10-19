import { useCallback, useEffect, useRef, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { SubmitHandler, useFieldArray, useForm, useWatch } from 'react-hook-form'
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
  const { connected, send } = useMsp()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: PID_TUNING_DEFAULTS
  });

  const { fields: pidValues } = useFieldArray({ control, name: "pids", });

  const updatePidTuning = useCallback(async (persist: boolean, data?: FormValues) => {
    const v = parsePidTuningResponse(await send(createPidTuningRequest(data && {
      mode: data.mode | (persist ? 0x80 : 0), // change config?
      rpGain: data.rpGain,
      rpStability: data.rpStability,
      rpAgility: data.rpAgility,
      rpBalance: data.rpBalance,
      yawGain: data.yawGain,
      yawStability: data.yawStability,
      pids: data.pids,
    })))
    reset({ ...getValues(), ...v })
  }, [send, reset, getValues])

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
    await updatePidTuning(true, data)
    await send(createSaveRequest())
    //await send(createRebootRequest())
  }, [send, updatePidTuning])

  const onLoad = useCallback(async () => {
    await updatePidTuning(false)
  }, [updatePidTuning])

  const onReset = useCallback(() => {
    reset(PID_TUNING_DEFAULTS);
  }, [reset]);

  const [mode, rpGain, rpStability, rpAgility, rpBalance, yawGain, yawStability] = useWatch({
    control, name: ["mode", "rpGain", "rpStability", "rpAgility", "rpBalance", "yawGain", "yawStability"]
  });

  // Watch only relevant parameters and send update on change
  const cmdPendingRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!connected) return
    if (!mode) return // only in slider mode

    const update = async () => {
      if (cmdPendingRef.current) return // do not send next until we recive previous command response
      cmdPendingRef.current = true
      //setTimeout(() => { cmdPendingRef.current = false }, 70) // throttle
      try {
        await updatePidTuning(false, {
          mode: mode,
          rpGain: rpGain,
          rpStability: rpStability,
          rpAgility: rpAgility,
          rpBalance: rpBalance,
          yawGain: yawGain,
          yawStability: yawStability,
          pids: getValues("pids"), // do not change pids
        })
      } catch (e) {
        console.warn("Failed to update PID tuning:", e)
      }
      await new Promise((resolve) => setTimeout(resolve, 50)); // min delay between commands
      cmdPendingRef.current = false
    }

    update()

    // trail call debounce
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => { update() }, 150)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    }

  }, [connected, mode, rpGain, rpStability, rpAgility, rpBalance, yawGain, yawStability, getValues, updatePidTuning])

  return <TabView title='Tuning' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Tuning</span>
            <Form.Switch label="Use Slider" {...register("mode")} />
          </Card.Header>
          <Card.Body>
            <Row>
              <Form.Group as={Col} controlId="rpGain" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll/Pitch Master Gain
                  <span>{rpGain}%</span>
                </Form.Label>
                <Form.Range min={40} max={160} step={10} {...register("rpGain")} readOnly={!mode} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="rpStability" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll/Pitch Stability
                  <span>{rpStability}%</span>
                </Form.Label>
                <Form.Range min={40} max={160} step={10} {...register("rpStability")} readOnly={!mode} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="rpAgility" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll/Pitch Agility
                  <span>{rpAgility}%</span>
                </Form.Label>
                <Form.Range min={40} max={160} step={10} {...register("rpAgility")} readOnly={!mode} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="rpBalance" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Roll to Pitch Balance
                  <span>{rpBalance}%</span>
                </Form.Label>
                <Form.Range min={40} max={160} step={10} {...register("rpBalance")} readOnly={!mode} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="yawGain" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Yaw Master Gain
                  <span>{yawGain}%</span>
                </Form.Label>
                <Form.Range min={40} max={160} step={10} {...register("yawGain")} readOnly={!mode} />
              </Form.Group>
            </Row>

            <Row>
              <Form.Group as={Col} controlId="yawStability" className="mb-3">
                <Form.Label className='d-flex justify-content-between align-items-start'>
                  Yaw Stability
                  <span>{yawStability}%</span>
                </Form.Label>
                <Form.Range min={40} max={160} step={10} {...register("yawStability")} readOnly={!mode} />
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
                  {AxisNames[i][0].toUpperCase() + AxisNames[i].slice(1)}
                </Col>
                {PidNames.map(col => (
                  <Col key={col}>
                    <Form.Control type="number" {...register(`pids.${i}.${col}`)} readOnly={!!mode} />
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