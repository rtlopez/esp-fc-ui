import { useCallback } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { createRebootRequest, createSaveRequest } from '@/api/esp'
import { Card, Col, Form, Row } from 'react-bootstrap'
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

  const { send } = useMsp()

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

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (_data) => {
    // updateInputConfig(parseInputConfigResponse(await send(createInputConfigRequest({
    //   val: data.val,
    // })))
    await send(createSaveRequest())
    await send(createRebootRequest())
  }, [send])

  const onLoad = useCallback(async () => {
    //updateInputConfig(parseInputConfigResponse(await send(createInputConfigRequest())))
  }, [])

  const onReset = useCallback(() => {
    reset(INPUT_DEFAULTS);
  }, [reset]);

  return <TabView title='Status' nosave onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
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