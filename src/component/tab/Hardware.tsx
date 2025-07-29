import { Card, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'
import { SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { useMsp } from '@/api/msp/MspProvider'
import { useCallback, useEffect } from 'react'
import { MspCommand } from '@/api/msp/msp'
import { createPinConfigRequest, parsePinConfigResponse } from '@/api/esp'

type PinFunction = {
  type: number
  index: number
  pin: number
  key?: number
}

type FormValues = {
  pins: PinFunction[]
}

const PIN_DFAULTS: FormValues = {
  pins: [
    { type: 0, index: 0, pin: 1 }, // serial
    { type: 0, index: 1, pin: 2 },
    { type: 0, index: 2, pin: 3 },
    { type: 0, index: 3, pin: 4 },
    { type: 0, index: 4, pin: 5 },
    { type: 0, index: 5, pin: 6 },

    { type: 1, index: 0, pin: 7 }, // output
    { type: 1, index: 1, pin: 8 },
    { type: 1, index: 0, pin: 9 },
    { type: 1, index: 1, pin: 10 },

    { type: 2, index: 0, pin: 11 }, // input
    { type: 5, index: 0, pin: 12 },
    { type: 5, index: 1, pin: 13 },
    { type: 6, index: 0, pin: 14 },

    { type: 7, index: 0, pin: 15 }, // buzzer/led
    { type: 8, index: 0, pin: 16 },

    { type: 3, index: 0, pin: 17 }, // i2c
    { type: 3, index: 1, pin: 18 },

    { type: 4, index: 0, pin: 19 }, // spi
    { type: 4, index: 1, pin: 20 },
    { type: 4, index: 2, pin: 21 },
    { type: 4, index: 3, pin: 22 },
    { type: 4, index: 4, pin: 23 },
    { type: 4, index: 5, pin: 24 },
  ]
}

const getSerialId = (index: number): string => {
  const id = Math.floor(index / 2) + 1
  const port = index % 2 ? 'TX' : 'RX'
  return ` ${port}${id}`
}

const getI2CId = (index: number): string => {
  const port = index % 2 ? 'SDA' : 'SCL'
  return `${port}`
}

const getSPIId = (index: number): string => {
  switch (index) {
    case 0: return "SCK"
    case 1: return "MOSI"
    case 2: return "MISO"
    case 3: return "CS GYRO"
    case 4: return "CS BARO"
    case 5: return "CS EXT"
    default: return "UNKN"
  }
}

const getFunctionTitle = (type: number) => {
  switch (type) {
    case 0: return `Serial Ports`
    case 1: return `Outpts`
    case 2: return `Inputs`
    case 3: return `I2C`
    case 4: return `SPI & I2C`
    case 5: return `ADC`
    case 6: return `BUTTON`
    case 7: return `BUZZER`
    case 8: return `LED`
    default: return `Unknown`
  }
}

const getFunctionName = (type: number, index: number): string => {
  switch (type) {
    case 0: return `${getSerialId(index)}`
    case 1: return `OUTPUT ${index}`
    case 2: return `PPM`
    case 3: return `${getI2CId(index)}`
    case 4: return `${getSPIId(index)}`
    case 5: return `${index ? 'IBAT' : 'VBAT'}`
    case 6: return `BUTTON`
    case 7: return `BUZZER`
    case 8: return `LED`
    default: return `Unknown ${index}`
  }
}

const HardwareTab = () => {

  const { connected, writeMsp, subscribeMsp } = useMsp()

  const {
    control,
    register,
    handleSubmit,
    reset,
    getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {}
  });

  const { fields: pins } = useFieldArray({
    control,
    name: "pins",
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    writeMsp(createPinConfigRequest(data))
  }

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_SAVE)) {
        console.log("saved")
      }
      if (msg.isCmd(MspCommand.ESP_CMD_PIN_CONFIG)) {
        const v = parsePinConfigResponse(msg)
        reset({ ...getValues(), ...v })
        console.log("recv", v)
      }
    })
  })

  const onLoad = useCallback(() => {
    console.log("load")
    writeMsp(createPinConfigRequest())
  }, [writeMsp])

  useEffect(() => {
    if (!connected) reset(PIN_DFAULTS);
    else onLoad();
  }, [connected, onLoad, reset])

  const grouped = pins.reduce((acc, curr, i) => {
    curr.key = i
    let key = curr.type
    if (key == 3) key = 4
    if (key == 5) key = 2
    if (key == 6) key = 2
    if (key == 7) key = 1
    if (key == 8) key = 1
    if (!acc[key]) acc[key] = []
    acc[key].push(curr)
    return acc
  }, {} as Record<number, PinFunction[]>)

  return <TabView title='Hardware' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>
      {Object.entries(grouped).map(([func, funcPins], k) => {
        return <Col lg={6}>
          <Card key={k} className='mb-3'>
            <Card.Header>{getFunctionTitle(parseInt(func, 10))}</Card.Header>
            <Card.Body>
              {funcPins.map((pin, i) => {
                return <Form.Group key={i} as={Row} controlId={`pin_${pin.key!}`} className="mb-3">
                  <Form.Label column>{`${getFunctionName(pin.type, pin.index)}`}</Form.Label>
                  <Col sm={6}>
                    <Form.Control type="number" min={-1} max={48} {...register(`pins.${pin.key!}.pin`)} />
                  </Col>
                </Form.Group >
              })}
            </Card.Body>
          </Card>
        </Col>
      })}

      {/* <Col lg={6}>
        <Card className='mb-3'>
          <Card.Header>Serial Ports</Card.Header>
          <Card.Body>
            <Row className='mb-3'>
              <Col>Port</Col>
              <Col>Function</Col>
              <Col>Speed</Col>
              <Col>Rx Pin</Col>
              <Col>Tx Pin</Col>
            </Row>
            {[0, 1, 2, 3].map((port) => {
              return <Row key={port}>
                <Col>
                  UART{port + 1}
                </Col>
                <Form.Group as={Col} controlId={`port_fn_${port}`} className="mb-3">
                  <Form.Select>
                    <option value="0">Disabled</option>
                    <option value="1">Serial RX</option>
                    <option value="2">Msp</option>
                    <option value="3">GPS</option>
                    <option value="4">Telemetry</option>
                    <option value="5">Blackbox</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group as={Col} controlId={`port_speed_${port}`} className="mb-3">
                  <Form.Select>
                    <option value="0">9 600</option>
                    <option value="1">19 200</option>
                    <option value="2">57 600</option>
                    <option value="3">115 200</option>
                    <option value="4">230 400</option>
                    <option value="5">250 000</option>
                    <option value="6">460 800</option>
                    <option value="7">500 000</option>
                    <option value="8">921 600</option>
                    <option value="9">1 000 000</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group as={Col} controlId={`port_rx_${port}`} className="mb-3">
                  <Form.Control type='number' min={-1} max={48} value={-1} readOnly />
                </Form.Group>
                <Form.Group as={Col} controlId={`port_tx_${port}`} className="mb-3">
                  <Form.Control type='number' min={-1} max={48} value={-1} readOnly />
                </Form.Group>
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col> */}

    </Row>
  </TabView>
}

export default HardwareTab
