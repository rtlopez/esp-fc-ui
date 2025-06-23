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

    {title ? <Row>
      <Col>
        <h3>{title}</h3>
      </Col>
    </Row> : null}

    {children}

    {!nosave ? <Row>
      <Col className="d-flex justify-content-end mt-3">
        <Button variant='outline-primary' className='me-2' disabled={!connected}>Load</Button>
        <Button variant='primary' disabled={!connected}>Save</Button>
      </Col>
    </Row> : null}

  </Form>
}

export default TabView