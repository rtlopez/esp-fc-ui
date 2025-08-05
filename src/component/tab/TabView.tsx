import { FormEventHandler, PropsWithChildren, useEffect, FC } from 'react'
import { MspCommand } from '@/api/msp/msp'
import { useMsp } from '@/api/msp/MspProvider'
import { Button, Col, Form, Row } from 'react-bootstrap'

type TabViewProps = {
  title?: string
  nosave?: boolean
  reboot?: boolean
  onSubmit?: FormEventHandler
  onLoad?: () => void
} & PropsWithChildren

const TabView: FC<TabViewProps> = ({ title, children, nosave, reboot, onSubmit, onLoad }) => {

  const { connected, subscribeMsp } = useMsp()

  useEffect(() => {
    return subscribeMsp((msg) => {
      if (msg.isCmd(MspCommand.ESP_CMD_REBOOT)) {
        console.log("reboot")
        if (onLoad) setTimeout(onLoad, 500)
      }
    })
  }, [subscribeMsp, onLoad])

  return <Form className='mb-5' onSubmit={onSubmit}>

    {title ? <Row className='mb-3 align-items-center'>
      <Col>
        <h3>{title}</h3>
      </Col>
      {!nosave ? <Col className="d-flex justify-content-end mt-3">
        <Button
          variant="outline-primary"
          className="me-2"
          disabled={!connected}
          onClick={(e) => {
            e.preventDefault();
            if (onLoad) onLoad()
          }}
        >
          <i className='bi bi-box-arrow-in-up'></i> Load
        </Button>
        <Button variant='primary' disabled={!connected} type="submit">
          <i className='bi bi-floppy'></i> {reboot ? 'Save And Reboot' : 'Save'}
        </Button>
      </Col> : null}
    </Row> : null}

    {children}

  </Form>
}

export default TabView