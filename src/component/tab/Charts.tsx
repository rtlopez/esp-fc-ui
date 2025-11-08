import { ForwardedRef, useCallback, useRef } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'
import { createRebootRequest, createSaveRequest } from '@/api/esp'
import { Card, Col, Row } from 'react-bootstrap'
import TabView from './TabView'

const data = [
  { time: "2023-01-01", value: 100 },
  { time: "2023-01-02", value: 101 },
  { time: "2023-01-03", value: 152 },
]

const ChartsTab = () => {

  const { send } = useMsp()

  const onLoad = useCallback(async () => {
    //updateInputConfig(parseInputConfigResponse(await send(createInputConfigRequest())))
  }, [])

  const onReset = useCallback(() => {
  }, []);

  useIntervalMsp(useCallback(async () => {
    //setGpsStatus(parseGpsResponse(await send(createGpsRequest())))
    //setGpsSatelites(parseGpsinfoResponse(await send(createGpsInfoRequest())))
  }, [send]), 550)

  return <TabView title='Status' nosave onLoad={onLoad} onReset={onReset}>
    <Row>
      <Col>
        <Card>
          <Card.Header>Chart</Card.Header>
          <Card.Body>
          </Card.Body>
        </Card>
      </Col>
    </Row>

  </TabView>
}

export default ChartsTab