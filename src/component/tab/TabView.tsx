import { useSerial } from '@/api/serial/SerialProvider'
import React, { PropsWithChildren } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'

type TabViewProps = {
  title?: string
  nosave?: boolean
} & PropsWithChildren

const TabView: React.FC<TabViewProps> = ({ title, children, nosave }) => {

  const { connected } = useSerial()

  return <Form className='mb-5'>

    {title ? <Row className='mb-3 align-items-center'>
      <Col>
        <h3>{title}</h3>
      </Col>
      {!nosave ? <Col className="d-flex justify-content-end mt-3">
        <Button variant='outline-primary' className='me-2' disabled={!connected}><i className='bi bi-box-arrow-in-up'></i> Load</Button>
        <Button variant='primary' disabled={!connected}><i className='bi bi-floppy'></i> Save</Button>
      </Col> : null}
    </Row> : null}

    {children}

  </Form>
}

export default TabView