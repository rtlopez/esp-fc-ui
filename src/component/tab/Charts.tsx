import { useCallback } from 'react'
//import { useMsp } from '@/api/msp/MspProvider'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'
import { Card, Col, Row } from 'react-bootstrap'
import TabView from './TabView'

const ChartsTab = () => {

  //const { send } = useMsp()

  const onLoad = useCallback(async () => {
    //updateInputConfig(parseInputConfigResponse(await send(createInputConfigRequest())))
  }, [])

  const onReset = useCallback(() => {
  }, []);

  useIntervalMsp(useCallback(async () => {
    //setGpsStatus(parseGpsResponse(await send(createGpsRequest())))
    //setGpsSatelites(parseGpsinfoResponse(await send(createGpsInfoRequest())))
  }, []), 550)

  return <TabView title='Status' nosave onLoad={onLoad} onReset={onReset}>
    <Row>
      <Col>
        <Card>
          <Card.Header>Chart</Card.Header>
          <Card.Body>
            <div style={{ height: 200 }}>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>

  </TabView>
}

export default ChartsTab