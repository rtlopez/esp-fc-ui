import { useCallback, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createCurrentConfigRequest, createCurrentRequest, createRebootRequest, createSaveRequest,
  createVoltageConfigRequest, createVoltageRequest, parseCurrentConfigResponse, parseCurrentResponse, parseVoltageConfigResponse,
  parseVoltageResponse
} from '@/api/esp'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'

type FormValues = {
  voltageCount: number
  voltageItems: {
    source: number
    scale: number
    cellWarning: number
  }[]
  currentCount: number
  currentItems: {
    source: number
    scale: number
    offset: number
  }[]
}

const INPUT_DEFAULTS = {
  voltageCount: 1,
  voltageItems: [
    { source: 0, scale: 100, cellWarning: 3.5 },
  ],
  currentCount: 1,
  currentItems: [
    { source: 0, scale: 100, offset: 0 },
  ],
}

const adcSources = [
  { id: 0, name: "- None -" },
  { id: 1, name: "VBAT (ADC1)" },
  { id: 2, name: "IBAT (ADC2)" },
]

const BatteryTab = () => {

  const { send } = useMsp()
  const [voltages, setVoltages] = useState<{ source: number, voltage: number, cells: number }[]>([])
  const [currents, setCurrents] = useState<{ source: number, current: number, consumption: number }[]>([])

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: INPUT_DEFAULTS
  });

  const { fields: voltageItems } = useFieldArray({ control, name: 'voltageItems' })
  const { fields: currentItems } = useFieldArray({ control, name: 'currentItems' })

  const updateVoltageConfig = useCallback(async (data?: FormValues) => {
    const r = data ? {
      count: data.voltageCount,
      items: data.voltageItems.map(item => ({
        source: item.source,
        scale: item.scale,
        cellWarning: item.cellWarning * 100,
      }))
    } : undefined
    const v = parseVoltageConfigResponse(await send(createVoltageConfigRequest(r)))
    console.log('voltage', v)
    reset({
      ...getValues(), voltageCount: v.count, voltageItems: v.items.map((item) => {
        return {
          source: item.source,
          scale: item.scale,
          cellWarning: item.cellWarning / 100,
        }
      })
    })
  }, [getValues, reset, send])

  const updateCurrentConfig = useCallback(async (data?: FormValues) => {
    const r = data ? { count: data.currentCount, items: data.currentItems } : undefined
    const v = parseCurrentConfigResponse(await send(createCurrentConfigRequest(r)))
    console.log('current', v)
    reset({ ...getValues(), currentCount: v.count, currentItems: v.items })
  }, [getValues, reset, send]);

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (data) => {
    await updateVoltageConfig(data)
    await updateCurrentConfig(data)
    await send(createSaveRequest())
    await send(createRebootRequest())
  }, [send, updateCurrentConfig, updateVoltageConfig])

  const onLoad = useCallback(async () => {
    await updateVoltageConfig()
    await updateCurrentConfig()
  }, [updateCurrentConfig, updateVoltageConfig])

  const onReset = useCallback(() => {
    reset(INPUT_DEFAULTS)
  }, [reset])

  useIntervalMsp(useCallback(async () => {
    setVoltages(parseVoltageResponse(await send(createVoltageRequest())).items.map(item => ({
      source: item.source,
      voltage: item.voltage * 0.01,
      cells: item.cells,
    })))
    setCurrents(parseCurrentResponse(await send(createCurrentRequest())).items.map(item => ({
      source: item.source,
      current: item.current * 0.01,
      consumption: item.consumption,
    })))
  }, [send]), 450)

  return <TabView title='Battery' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col md={6}>
        <Card>
          <Card.Header>Voltage</Card.Header>
          <Card.Body>
            {voltageItems.map((item, index) => (
              <div key={item.id} className="mb-3">
                <FormItem id={`voltageItems.${index}.source`} label={`Source #${index + 1}`}>
                  <Form.Select {...register(`voltageItems.${index}.source`)} >
                    {adcSources.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                  </Form.Select>
                </FormItem>
                <FormItem id={`voltageItems.${index}.scale`} label="Scale">
                  <Form.Control type="number" min={1} max={10000} {...register(`voltageItems.${index}.scale`)} />
                </FormItem>
                <FormItem id={`voltageItems.${index}.cellWarning`} label="Cell Warning (V)">
                  <Form.Control type="number" step={0.01} min={0} max={4.3} {...register(`voltageItems.${index}.cellWarning`)} />
                </FormItem>
                <div className="mb-2 p-2 border-bottom">
                  <span className="d-block text-end">
                    {voltages[index]?.cells || 0} cells,&nbsp;
                    <strong>{(voltages[index]?.voltage || 0).toFixed(2)} V</strong>
                  </span>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <Card.Header>Current</Card.Header>
          <Card.Body>
            {currentItems.map((item, index) => (
              <div key={item.id} className="mb-3">
                <FormItem id={`currentItems.${index}.source`} label={`Source #${index + 1}`}>
                  <Form.Select {...register(`currentItems.${index}.source`)} >
                    {adcSources.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                  </Form.Select>
                </FormItem>
                <FormItem id={`currentItems.${index}.scale`} label="Scale [mV/A]">
                  <Form.Control type="number" min={1} max={10000} {...register(`currentItems.${index}.scale`)} />
                </FormItem>
                <FormItem id={`currentItems.${index}.offset`} label="Offset">
                  <Form.Control type="number" min={-10000} max={10000} {...register(`currentItems.${index}.offset`)} />
                </FormItem>
                <div className="mb-2 p-2 border-bottom">
                  <span className="d-block text-end">
                    {(currents[index]?.consumption || 0).toFixed(0)} mAh,&nbsp;
                    <strong>{(currents[index]?.current || 0).toFixed(2)} A</strong>
                  </span>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default BatteryTab