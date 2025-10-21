import { useCallback, useEffect, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { useBoardInfo } from '@/api/BoardInfoProvider'
import { useBlobAccumulator } from '@/api/hook/useBlobAccumulator'
import { AttitudeIndicator, HeadingIndicator } from 'react-typescript-flight-indicators'
import { Badge, Button, Card, Col, ListGroup, Row } from 'react-bootstrap'
import { createQuaternion, Euler, Quaternion, radToDeg } from '@/api/spatial'
import {
  createAttitudeRequest, createCalibrateRequest, createDefaultsRequest,
  createRebootRequest, parseAttitudeResponse
} from '@/api/esp'
import { parseArmingDisableFlags, SensorType, sensorPresent } from "@/api/board"
import TabView from './TabView'
import { DroneX } from '../model'
import { Preview3DModel } from '../widget'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'

const QUATERNION_INIT = createQuaternion(0, 0, 0, 1)
const EULER_INIT = { roll: 0, pitch: 0, yaw: 0 }

const textEncoder = new TextEncoder()

const StatusTab = () => {

  const { status, statistics, version, connected } = useBoardInfo()
  const [attitudeE, setAttitudeE] = useState<Euler>(EULER_INIT)
  const [attitudeQ, setAttitudeQ] = useState<Quaternion>(QUATERNION_INIT)
  const { writeText, send, subscribeText } = useMsp()
  const { append, finalize, download, dateStr } = useBlobAccumulator("text/plain")

  useEffect(() => {
    return subscribeText((text: string) => {
      append(textEncoder.encode(text).buffer)
      if (text.includes("#dump end")) {
        download(finalize(), `espfc_dump_${dateStr()}.txt`)
      }
    })
  }, [subscribeText, append, finalize, download, dateStr])

  const onReset = useCallback(() => {
    setAttitudeQ(QUATERNION_INIT)
    setAttitudeE(EULER_INIT)
  }, [])

  const onLoad = useCallback(async () => {
  }, [])

  // poll some msp messages
  useIntervalMsp(useCallback(async () => {
    const msg = await send(createAttitudeRequest())
    const [q, e] = parseAttitudeResponse(msg)
    setAttitudeQ(q)
    setAttitudeE(e)
  }, [send]), 120);

  const handleCalibrateGyro = useCallback(async () => {
    await send(createCalibrateRequest({ mode: 1 }))
  }, [send])

  const handleCalibrateMag = useCallback(async () => {
    await send(createCalibrateRequest({ mode: 2 }))
  }, [send])

  const handleReset = useCallback(async () => {
    await send(createDefaultsRequest())
    await send(createRebootRequest())
  }, [send])

  const handleBackup = useCallback(async () => {
    await writeText('\ndump') // \n workaround to flush FC RX buffer
  }, [writeText])

  const attitudeStr = `${radToDeg(attitudeE.roll).toFixed(1)}\u00b0 x ${radToDeg(attitudeE.pitch).toFixed(1)}\u00b0`
  const headingStr = `${radToDeg(attitudeE.yaw).toFixed(1)}\u00b0`
  const armingDisableFlags = parseArmingDisableFlags(status?.armingDisableFlags || 0)
  const heapUsed = statistics ? (statistics.heapTotal - statistics.heapFree) : 0

  return <TabView title='Status' nosave onLoad={onLoad} onReset={onReset}>
    <Row>
      <Col>
        <Preview3DModel attitudeQ={attitudeQ}>
          <DroneX />
        </Preview3DModel>
      </Col>
    </Row>

    <Row>
      <Col md={6}>

        <Card className='mb-3'>
          <Card.Header>Instruments</Card.Header>
          <Card.Body>
            <Row>
              <Col xs={6} className='text-center'>
                <AttitudeIndicator roll={radToDeg(-attitudeE.roll)} pitch={radToDeg(-attitudeE.pitch)} showBox={false} size='160px' />
                <br />
                Attitude {attitudeStr}
              </Col>
              <Col xs={6} className='text-center'>
                <HeadingIndicator heading={radToDeg(attitudeE.yaw)} showBox={false} size='160px' />
                <br />
                Heading {headingStr}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className='mb-3'>
          <Card.Header>System</Card.Header>
          <Card.Body>
            <div className='d-flex justify-content-between align-items-start'>
              <span>Firmware</span>
              <span>{version ? `${version.fwVersion ?? ''} ${version.fwRevision ?? ''}` : '-'}</span>
            </div>
            <div className='d-flex justify-content-between align-items-start'>
              <span>Memory usage</span>
              <span>{statistics ? `${(heapUsed / 1024).toFixed(0)} / ${(statistics.heapTotal / 1024).toFixed(0)} kB (${(heapUsed / statistics.heapTotal * 100).toFixed(1)}%)` : '-'}</span>
            </div>
            <div className='d-flex justify-content-between align-items-start'>
              <span>Flash usage</span>
              <span>{statistics ? `${(statistics.flashUsed / 1024 / 1024).toFixed(1)} / ${(statistics.flashTotal / 1024 / 1024).toFixed(1)} MB (${(statistics.flashUsed / (statistics.flashTotal + 1) * 100).toFixed(1)}%)` : '-'}</span>
            </div>
          </Card.Body>
        </Card>

      </Col>
      <Col md={6}>
        <Card className='mb-3'>
          <Card.Header>Tools</Card.Header>
          <Card.Body>
            <Button onClick={handleCalibrateGyro} className="me-2" disabled={!connected}>Calibrate Gyro</Button>
            <Button onClick={handleCalibrateMag} className="me-2" disabled={!connected}>Calibrate Mag</Button>
            <Button onClick={handleReset} className="me-2" variant="outline-primary" disabled={!connected}>Reset To Defaults</Button>
            <Button onClick={handleBackup} className="me-2" variant="primary" disabled={!connected}>Backup</Button>
          </Card.Body>
        </Card>
        <Card className='mb-3'>
          <Card.Header>Pre-Flight Checks</Card.Header>
          <Card.Body>
            <ListGroup>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Arming Prevention</span>
                <span>{armingDisableFlags.length ? armingDisableFlags.map((name, k) => <Badge key={k} bg="danger" className="ms-1">{name}</Badge>) :
                  (connected ? <Badge bg="success">OK</Badge> : <Badge bg="danger">Not connected</Badge>)}</span>
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Gyro</span>
                {sensorPresent(status?.sensors, SensorType.GYRO) ? <Badge bg="success">OK</Badge> : <Badge bg="danger">Required</Badge>}
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Accelerometer</span>
                {sensorPresent(status?.sensors, SensorType.ACC) ? <Badge bg="success">OK</Badge> : <Badge bg="warning">No Stab</Badge>}
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>GPS</span>
                {sensorPresent(status?.sensors, SensorType.GPS) ? <Badge bg="success">OK</Badge> : <Badge bg="warning">No Nav</Badge>}
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Barometer</span>
                {sensorPresent(status?.sensors, SensorType.BARO) ? <Badge bg="success">OK</Badge> : <Badge bg="info">Optional</Badge>}
              </ListGroup.Item>
              <ListGroup.Item className='d-flex justify-content-between align-items-start'>
                <span>Compass</span>
                {sensorPresent(status?.sensors, SensorType.MAG) ? <Badge bg="success">OK</Badge> : <Badge bg="info">Optional</Badge>}
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>

      </Col>
    </Row>

  </TabView>
}

export default StatusTab