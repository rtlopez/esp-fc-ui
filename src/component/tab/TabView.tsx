import React, { PropsWithChildren } from 'react'
import { Button, Col, Form, Row } from 'react-bootstrap'

type TabViewProps = {
  title?: string
  nosave?: boolean
} & PropsWithChildren

const TabView: React.FC<TabViewProps> = ({ title, children, nosave }) => {

  return <Form className='mb-5'>

    {title ? <Row>
      <Col>
        <h3>{title}</h3>
      </Col>
    </Row> : null}

    {children}

    {!nosave ? <Row>
      <Col className="d-flex justify-content-end mt-3">
        <Button variant='secondary' className='me-2'>Load</Button>
        <Button>Save</Button>
      </Col>
    </Row> : null}

  </Form>
}

export default TabView