import { FormEventHandler, PropsWithChildren, useEffect, FC, useCallback, FormEvent, MouseEvent } from 'react'
import { MspCommand } from '@/api/msp/msp'
import { useMsp } from '@/api/msp/MspProvider'
import { Button, Col, Form, Row } from 'react-bootstrap'

type TabViewProps = {
  title?: string
  nosave?: boolean
  reboot?: boolean
  onSubmit?: FormEventHandler
  onLoad?: () => void
  onReset?: () => void
} & PropsWithChildren

const TabView: FC<TabViewProps> = ({ title, children, nosave, reboot, onSubmit, onLoad, onReset }) => {

  const { connected, rebooting, saving, initialized, subscribeMsp } = useMsp()

  useEffect(() => {
    if (!connected) onReset?.()
    else if(initialized) onLoad?.()
  }, [connected, initialized, onReset, onLoad])

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_REBOOT)) {
        if (onLoad) setTimeout(onLoad, 900)
      }
    })
  }, [subscribeMsp, onLoad])

  const submitHandler = useCallback(((e: FormEvent<Element>) => {
    console.log("btn.save")
    if(initialized) onSubmit?.(e)
  }), [initialized, onSubmit])

  const loadHandler = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    console.log("btn.load")
    e.preventDefault()
    if(initialized) onLoad?.()
  }, [initialized, onLoad])

  return <Form className='mb-5' onSubmit={submitHandler}>

    {title ? <Row className='mb-3 align-items-center'>
      <Col>
        <h3>{title}</h3>
      </Col>
      {!nosave ? <Col className="d-flex justify-content-end mt-3">
        <Button
          variant="outline-primary"
          className="me-2"
          disabled={!connected || saving || rebooting}
          onClick={loadHandler}
        >
          <i className='bi bi-box-arrow-in-up'></i> Load
        </Button>
        <Button variant='primary' disabled={!connected || saving || rebooting} type="submit">
          <i className='bi bi-floppy'></i> {reboot ? 'Save And Reboot' : 'Save'}
        </Button>
      </Col> : null}
    </Row> : null}

    {children}

  </Form>
}

export default TabView