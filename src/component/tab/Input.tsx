import { Card, Col, ProgressBar, Row } from 'react-bootstrap'
import { RcControls } from '@/component/widget'
import TabView from './TabView'

const InputTab = () => {

  return <TabView title='Input'>
    <Row>

      <Col lg={6}>
        <Card>
          <Card.Header>Channel Monitor</Card.Header>
          <Card.Body>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(ch => {
              return <Row key={ch}>
                <Col xs={2}>
                  CH{ch + 1}
                </Col>
                <Col xs={10}>
                  <ProgressBar key={ch} now={ch * 12.5} label={`${ch * 12.5}`} min={0} max={100} />
                </Col>
              </Row>
            })}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={6}>
        <Card>
          <Card.Header>Sticks</Card.Header>
          <Card.Body className='d-flex justify-content-between align-items-start'>
            <RcControls w={150} h={150} px={0} py={-1} pr={10} />
            <RcControls w={150} h={150} px={0} py={0} pr={10} />
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView >
}

export default InputTab
