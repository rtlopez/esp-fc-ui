import { useCallback, useEffect } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { useMsp } from '@/api/msp/MspProvider'
import { MspCommand } from '@/api/msp/msp'
import { createSaveRequest } from '@/api/esp'
import { SubmitHandler, useForm } from 'react-hook-form'
import TabView from './TabView'
import { FormItem } from '../widget'

type FormValues = {
  val: number
}

const INPUT_DEFAULTS = {
  val: 0,
}

const TemplateTab = () => {

  const { connected, writeMsp, subscribeMsp } = useMsp()

  const {
    //control,
    register,
    handleSubmit,
    reset,
    //getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: INPUT_DEFAULTS
  });

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_SAVE)) {
        console.log("saved")
      }
      // if (msg.isCmd(MspCommand.ESP_CMD_INPUT_CONFIG)) {
      //   const v = parseInputConfigResponse(msg)
      //   reset({ ...getValues(), ...v })
      //   console.log("recv", v)
      // }
    })
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("save", data)
    // const v = {
    //   val: data.val,
    // }
    // writeMsp(createInputConfigRequest(v))
    writeMsp(createSaveRequest())
  }

  const onLoad = useCallback(() => {
    console.log("load")
    //writeMsp(createInputConfigRequest())
  }, [])

  useEffect(() => {
    if (!connected) reset(INPUT_DEFAULTS);
    else onLoad();
  }, [connected, reset, onLoad]);

  return <TabView title='Status' nosave onSubmit={handleSubmit(onSubmit)} onLoad={onLoad}>
    <Row>

      <Col md={6}>
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>
            <FormItem id="val" label="Smooting">
              <Form.Control type="number" min={0} max={250} {...register("val")} />
            </FormItem>
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

export default TemplateTab