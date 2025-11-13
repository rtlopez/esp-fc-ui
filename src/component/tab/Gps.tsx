import { useCallback, useEffect, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import {
  createGpsInfoRequest,
  createGpsRequest, EspGpsInfoResponse, EspGpsResponse,
  parseGpsinfoResponse,
  parseGpsResponse
} from '@/api/esp'
import { Badge, Card, Col, Row, Table } from 'react-bootstrap'
import { SubmitHandler, useForm } from 'react-hook-form'
import TabView from './TabView'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { LatLngTuple } from 'leaflet'

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
  pDop: 99.99,
  hAccu: 6553.5,
  vAccu: 6553.5,
}

const GPS_SATS_DEFAULT: EspGpsInfoResponse = {
  count: 1,
  svs: [{
    gnssId: 0,
    id: 0,
    quality: 0,
    cno: 8,
  }]
}

const gnssNames = ["GPS", "SBAS", "GALILEO", "BEIDU", "IMES", "QZSS", "GLONAS"]
const qualityNames = ["no signal", "searching", "acquired", "unusable", "locked", "fully locked", "fully locked", "fully locked"]
const usedNames = ["No", "Yes"]

const mapUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const mapCopy = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

//const mapUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
//const mapUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
//const mapUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'

//const mapUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}'
//const mapUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'
//const mapCopy = '&copy; Esri'

const RecenterMap = ({ position }: { position: LatLngTuple }) => {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), { animate: true })
    }
  }, [position, map])
  return null
}

const LocationMarker = ({ position }: { position: LatLngTuple }) => {
  return <Marker position={position}>
    <Popup>
      {position.map(v => v?.toFixed(7)).join(', ')}
    </Popup>
  </Marker>
}

const mapInitPos = [52.232733,21.006615] as LatLngTuple

const MapView = ({ position }: { position: LatLngTuple }) => {
  return <MapContainer
    center={mapInitPos}
    zoom={16}
    scrollWheelZoom={false}
    style={{ height: "40vh", width: "100%" }}
  >
    <TileLayer attribution={mapCopy} url={mapUrl} />
    <LocationMarker position={position} />
    <RecenterMap position={position} />
  </MapContainer>
}

const GpsTab = () => {

  const { send } = useMsp()
  const [gpsStatus, setGpsStatus] = useState(GPS_STATUS_DEFAULT)
  const [gpsSatelites, setGpsSatelites] = useState(GPS_SATS_DEFAULT)

  const {
    handleSubmit,
    reset,
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

  const mapMarker = [gpsStatus.latitude, gpsStatus.longitude] as LatLngTuple

  let fixVariant = "secondary"
  let fixLabel = "No"
  if(gpsStatus.fixType > 0) {
    fixVariant = "info"
    fixLabel = "2D"
  } else if(gpsStatus.fixType > 1) {
    fixVariant = "success"
    fixLabel = "3D"
  }

  return <TabView title='Status' nosave onSubmit={handleSubmit(onSubmit)} onLoad={onLoad} onReset={onReset}>
    <Row>

      <Col md={6}>
        <Card>
          <Card.Header>Status</Card.Header>
          <Card.Body>
            <MapView position={mapMarker} />
            <Table striped borderless className="mt-3">
              <tbody>
                <tr>
                  <td>Fix [Num Sats]</td>
                  <td className='text-end'><Badge bg={fixVariant}>{fixLabel}</Badge> [{gpsStatus.sats}]</td>
                </tr>
                <tr>
                  <td>Lat / Lon [&deg;]</td>
                  <td className='text-end'>{gpsStatus.latitude.toFixed(7)}, {gpsStatus.longitude.toFixed(7)}</td>
                </tr>
                <tr>
                  <td>Altitude [m]</td>
                  <td className='text-end'>{gpsStatus.altitude.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Speed [m/s]</td>
                  <td className='text-end'>{gpsStatus.speed.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Heading [&deg;]</td>
                  <td className='text-end'>{gpsStatus.course.toFixed(1)}</td>
                </tr>
                <tr>
                  <td>Date Time [UTC]</td>
                  <td className='text-end'>{new Date(gpsStatus.time).toISOString().replace('T', ' ').replace('.000Z', '')}</td>
                </tr>
                <tr>
                  <td>Accuracy</td>
                  <td className='text-end'>PDOP: {gpsStatus.pDop.toFixed(2)}, H: {gpsStatus.hAccu.toFixed(1)} m, V: {gpsStatus.vAccu.toFixed(1)} m</td>
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
            <Table size='sm' striped borderless>
              <thead>
                <tr>
                  <th>GNSS</th><th>ID</th><th>Used</th><th>Quality</th><th className='text-end'>Signal</th>
                </tr>
              </thead>
              <tbody>
                {gpsSatelites.svs.map((svs, i) => {
                  const used = (svs.quality & 0x08) >> 3
                  const quality = svs.quality & 0x07
                  const usedVariant = used ? "success" : "secondary"
                  const qualityVariant = quality > 4 ? "success" : (quality > 2 ? "warning" : "secondary")
                  return <tr key={i}>
                    <td>{gnssNames[svs.gnssId] || '?'}</td>
                    <td>{svs.id}</td>
                    <td><Badge bg={usedVariant}>{usedNames[used]}</Badge></td>
                    <td><Badge bg={qualityVariant}>{qualityNames[quality]}</Badge></td>
                    <td className='text-end'><meter value={svs.cno} low={10} max={55} />&nbsp;{svs.cno.toFixed(0).padStart(2, '0')}</td>
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
