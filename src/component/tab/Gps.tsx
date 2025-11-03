import { useCallback, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createGpsInfoRequest,
  createGpsRequest, EspGpsInfoResponse, EspGpsResponse,
  parseGpsinfoResponse,
  parseGpsResponse
} from '@/api/esp'
import { Card, Col, Row, Table } from 'react-bootstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import TabView from './TabView'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'

type FormValues = {
  fake: number
}

const INPUT_DEFAULTS = {
  fake: 0,
}

const GPS_STATUS_DEFAULT: EspGpsResponse = {
  time: 0,
  fixType: 0,
  sats: 0,
  latitude: 0,
  longitude: 0,
  altitude: 0,
  speed: 0,
  course: 0,
}

const GPS_SATS_DEFAULT: EspGpsInfoResponse = {
  count: 1,
  svs: [{
    gnssId: 0,
    id: 0,
    quality: 0,
    cno: 0,
  }]
}

const gnssNames = ["GPS", "SBAS", "GALILEO", "BEIDU", "IMES", "QZSS", "GLONAS"]
const qualityNames = ["no signal", "searching", "acquired", "unusable", "locked", "fully locked", "fully locked", "fully locked"]
const usedNames = ["No", "Yes"]

const GpsTab = () => {

  const { send } = useMsp()
  const [gpsStatus, setGpsStatus] = useState(GPS_STATUS_DEFAULT)
  const [gpsSatelites, setGpsSatelites] = useState(GPS_SATS_DEFAULT)

  const {
    //control,
    //register,
    handleSubmit,
    reset,
    //getValues,
    //formState: { errors }
  } = useForm<FormValues>({
    defaultValues: INPUT_DEFAULTS
  });

  const onSubmit: SubmitHandler<FormValues> = useCallback(async (_data) => {
  }, [])

  const onLoad = useCallback(async () => {
  }, [])

  const onReset = useCallback(() => {
    reset(INPUT_DEFAULTS);
    setGpsStatus(GPS_STATUS_DEFAULT)
    setGpsSatelites(GPS_SATS_DEFAULT)
  }, [reset]);

  useIntervalMsp(useCallback(async () => {
    setGpsStatus(parseGpsResponse(await send(createGpsRequest())))
    setGpsSatelites(parseGpsinfoResponse(await send(createGpsInfoRequest())))
  }, [send]), 550)

  return <TabView title='Status' nosave onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col md={6}>
        <Card>
          <Card.Header>Status</Card.Header>
          <Card.Body>
            <Table>
              <tbody>
                <tr>
                  <td>Fix (Num Sats)</td>
                  <td className='text-end'>{gpsStatus.fixType} ({gpsStatus.sats})</td>
                </tr>
                <tr>
                  <td>Lat / Lon</td>
                  <td className='text-end'>{(gpsStatus.latitude * 1e-7).toFixed(7)} / {(gpsStatus.longitude * 1e-7).toFixed(7)} &deg;</td>
                </tr>
                <tr>
                  <td>Altitude</td>
                  <td className='text-end'>{(gpsStatus.altitude * 0.001).toFixed(2)} m</td>
                </tr>
                <tr>
                  <td>Speed</td>
                  <td className='text-end'>{(gpsStatus.speed * 0.001).toFixed(2)} m/s</td>
                </tr>
                <tr>
                  <td>Heading</td>
                  <td className='text-end'>{(gpsStatus.course * 0.00001).toFixed(1)} &deg;</td>
                </tr>
                <tr>
                  <td>Date Time</td>
                  <td className='text-end'>{new Date(gpsStatus.time * 1000).toISOString().replace('T', ' ').replace('.000Z', '')} UTC</td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card>
          <Card.Header>Satelites ({gpsSatelites.count})</Card.Header>
          <Card.Body>
            <Table>
              <thead>
                <tr>
                  <th>GNSS</th><th>ID</th><th>Used</th><th>Status</th><th>Signal</th>
                </tr>
              </thead>
              <tbody>
                {gpsSatelites.svs.map((svs, i) => {
                  const used = svs.quality & (1 << 3) ? 1 : 0
                  return <tr key={i}>
                    <td>{gnssNames[svs.gnssId] || '?'}</td>
                    <td>{svs.id}</td>
                    <td>{usedNames[used]}</td>
                    <td>{qualityNames[svs.quality & 0x07]}</td>
                    <td>{svs.cno}</td>
                  </tr>
                })}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Col>

    </Row>
  </TabView>
}

export default GpsTab