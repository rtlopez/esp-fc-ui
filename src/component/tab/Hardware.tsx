import { Card, Col, Form, Row } from 'react-bootstrap'
import TabView from './TabView'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useMsp } from '@/api/msp/MspProvider'
import { useCallback, useEffect } from 'react'
import { MspCommand } from '@/api/msp/msp'

type FormValues = {
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

  const onSubmit: SubmitHandler<FormValues> = (data) => {
  }

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_SAVE)) {
        console.log("saved")
      }
    })
  })

  const onLoad = useCallback(() => {
    console.log("load")
  }, [writeMsp])

  useEffect(() => {
    if (!connected) return;
    else onLoad();
  }, [connected, onLoad])

  return <TabView title='Hardware' onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col lg={6}>
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
      </Col>

      <Col lg={6}>

      </Col>


    </Row>
  </TabView>
}

export default HardwareTab
