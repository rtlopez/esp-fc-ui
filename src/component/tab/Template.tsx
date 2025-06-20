import { Card, Col, Row } from 'react-bootstrap'
import TabView from './TabView'

const TemplateTab = () => {

  return <TabView title='Status' nosave>
    <Row>

      <Col md={6}>
        <Card>
          <Card.Header>Header</Card.Header>
          <Card.Body>
            Body
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