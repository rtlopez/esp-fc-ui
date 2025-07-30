import { useCallback, useEffect, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'
import { useMsp } from '@/api/msp/MspProvider'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { MspCommand } from '@/api/msp/msp'
import { createInputConfigRequest, createSaveRequest, createSerialConfigRequest, parseSerialConfigResponse, parseSerialNamesResponse } from '@/api/esp'
import { FormItem } from '../widget'

type SerialConfig = {
  baud: number
  func: number
}

type FormValues = {
  serialCount: number
  serialPorts: SerialConfig[]
}

const SERIAL_DEFAULTS = {
  count: 0,
  serialPorts: [
    { baud: 115200, func: 0 }, // USB
    { baud: 115200, func: 0 }, // UART1
    { baud: 115200, func: 0 }, // UART2
    { baud: 115200, func: 0 }, // WIFI
  ]
}

const serialBauds = [ 9600, 19200, 57600, 115200, 230400, 250000, 460800, 500000, 921600, 1000000 ]

const ConfigurationTab = () => {

  const { connected, writeMsp, subscribeMsp } = useMsp()
  const [ serialNames, setSerialNames ] = useState(['USB', 'UART1', 'UART2', 'WIFI'])

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: SERIAL_DEFAULTS
  });

  const { fields: serialPorts } = useFieldArray({
    control,
    name: "serialPorts",
  });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_SAVE)) {
        console.log("saved")
      }
      if (msg.isCmd(MspCommand.ESP_CMD_SERIAL_NAMES)) {
        const v = parseSerialNamesResponse(msg)
        setSerialNames(v.names)
        console.log("recv", v)
      }
      if (msg.isCmd(MspCommand.ESP_CMD_SERIAL_CONFIG)) {
        const v = parseSerialConfigResponse(msg)
        reset({ ...getValues(), ...v })
        console.log("recv", v)
      }
    })
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    writeMsp(createSerialConfigRequest({
      count: data.serialCount,
      configs: data.serialPorts.map((port) => ({
        baud: port.baud,
        func: port.func
      }))
    }))
    writeMsp(createSaveRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createSerialConfigRequest())
  }, [writeMsp])

  return <TabView title='Configuration' nosave onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col md={6}>
        <Card>
          <Card.Header>Serial Ports</Card.Header>
          <Card.Body>
            <Row className='mb-3'>
              <Col>Port</Col>
              <Col>Function</Col>
              <Col>Speed</Col>
            </Row>
            {serialPorts.map((_port, i) => {
              return <Row key={i}>
                <Col>
                  {serialNames[i] || `Port ${i}`}
                </Col>
                <Form.Group as={Col} controlId={`port_fn_${i}`} className="mb-3">
                  <Form.Select {...register(`serialPorts.${i}.func`)}>
                    <option value="0">Disabled</option>
                    <option value="1">Serial RX</option>
                    <option value="2">Msp</option>
                    <option value="3">GPS</option>
                    <option value="4">Telemetry</option>
                    <option value="5">Blackbox</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group as={Col} controlId={`port_speed_${i}`} className="mb-3">
                  <Form.Select {...register(`serialPorts.${i}.baud`)}>
                    { serialBauds.map((baud, j) => {
                      return <option key={j} value={baud}>{baud.toLocaleString()}</option>
                    }) }
                  </Form.Select>
                </Form.Group>
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>
            Body
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default ConfigurationTab