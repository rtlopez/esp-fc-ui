import React, { PropsWithChildren } from 'react'
import { Button, ButtonGroup, Col, Container, Form, Row } from 'react-bootstrap'

type TabViewProps = {
  title?: string
  nosave?: boolean
} & PropsWithChildren

const TabView: React.FC<TabViewProps> = ({ title, children, nosave }) => {

  return <Container>
    <Form>

      {title ? <Row>
        <Col>
          <h3>{title}</h3>
        </Col>
      </Row> : null}

      <Row>
        {children}
      </Row>

      {!nosave ? <Row>
        <Col className="d-flex justify-content-end mt-3">
          <ButtonGroup>
            <Button variant='secondary'>Load</Button>
            <Button>Save</Button>
          </ButtonGroup>
        </Col>
      </Row> : null}

    </Form>
  </Container>
}

export default TabView