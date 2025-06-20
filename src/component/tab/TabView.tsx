import React, { PropsWithChildren } from 'react'
import { Button, ButtonGroup, Col, Container, Form, Row } from 'react-bootstrap'

type TabViewProps = {
  title?: string
  nosave?: boolean
} & PropsWithChildren

const TabView: React.FC<TabViewProps> = ({ title, children, nosave }) => {

  return <Form>

    {title ? <Row>
      <Col>
        <h3>{title}</h3>
      </Col>
    </Row> : null}

    {children}

    {!nosave ? <Row>
      <Col className="d-flex justify-content-end mt-3">
        <ButtonGroup>
          <Button variant='secondary'>Load</Button>
          <Button>Save</Button>
        </ButtonGroup>
      </Col>
    </Row> : null}

  </Form>
}

export default TabView