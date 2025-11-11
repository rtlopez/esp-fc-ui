import { useCallback, useRef, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'
import { Card, Col, Row } from 'react-bootstrap'
import TabView from './TabView'
import { createSensorsRequest, EspSensorsResponse, parseSensorsResponse } from '@/api/esp'
import RealtimeChart, { RealTimeChartRef } from '../widget/RealTimeChart'
import { ChartData, ChartDataset, ChartOptions } from 'chart.js'
import { radToDeg } from '@/api/spatial'

type MakeOptionsArg = {
  min: number
  max: number
}

const makeOptions = ({ min, max }: MakeOptionsArg): ChartOptions<"line"> => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        type: "linear",
        title: { display: false, text: "Time", color: "white" },
        grid: { color: "rgba(200,200,200,0.3)" },
        ticks: {
          color: "white",
          callback: (value: string | number) => {
            value = typeof value === 'string' ? parseInt(value, 10) : value
            return ((value / 1000)).toFixed(0)
          },
        },
      },
      y: {
        title: { display: false, text: "Value" },
        grid: { color: "rgba(200,200,200,0.3)" },
        ticks: { color: "white" },
        suggestedMin: min,
        suggestedMax: max,
      },
    },
    plugins: {
      legend: { display: true, labels: { color: 'white' } },
      tooltip: { enabled: false },
    }
  }
}

type MakeDataSetArg = {
  label: string
  color: string
}

function makeDataSets(datasets: MakeDataSetArg[]): ChartData<'line'> {
  return {
    labels: [],
    datasets: datasets.map(d => ({
      label: d.label,
      borderColor: d.color,
      borderWidth: 1,
      tension: 0,
      pointRadius: 0,
    } as ChartDataset<'line'>)),
  }
}

const gyroChartOptions = makeOptions({min: -500, max: 500})
const gyroInitialData = makeDataSets([
  { label: 'Roll', color: 'red'},
  { label: 'Pitch', color: '#2dace3'},
  { label: 'Yaw', color: 'yellow'},
])

const accelChartOptions = makeOptions({min: -15, max: 15})
const acceInitialData = makeDataSets([
  { label: 'Roll', color: 'red'},
  { label: 'Pitch', color: '#2dace3'},
  { label: 'Yaw', color: 'yellow'},
])

const magChartOptions = makeOptions({min: -1, max: 1})
const magInitialData = makeDataSets([
  { label: 'Roll', color: 'red'},
  { label: 'Pitch', color: '#2dace3'},
  { label: 'Yaw', color: 'yellow'},
])

const baroChartOptions = makeOptions({min: -1, max: 1})
const baroInitialData = makeDataSets([
  { label: 'Altitude', color: 'red'},
])

const SENSORS_DEFAULTS = {
  gyro: { x: 0, y: 0, z: 0 },
  accel: { x: 0, y: 0, z: 0 },
  mag: { x: 0, y: 0, z: 0 },
  baroAlt: 0,
} as EspSensorsResponse

const ChartsTab = () => {

  const [sensors, setSensors] = useState(SENSORS_DEFAULTS)
  const gyroHandleRef = useRef<RealTimeChartRef>(null)
  const accelHandleRef = useRef<RealTimeChartRef>(null)
  const magHandleRef = useRef<RealTimeChartRef>(null)
  const baroHandleRef = useRef<RealTimeChartRef>(null)
  const { send } = useMsp()

  const onLoad = useCallback(async () => {
  }, [])

  const onReset = useCallback(() => {
    setSensors(SENSORS_DEFAULTS)
  }, []);

  useIntervalMsp(useCallback(async () => {
    const sensors = parseSensorsResponse(await send(createSensorsRequest()))
    setSensors(sensors)
    const {gyro, accel, mag, baroAlt } = sensors
    const now = Date.now()
    gyroHandleRef.current?.addSample(now, [radToDeg(gyro.x), radToDeg(gyro.y), radToDeg(gyro.z)])
    accelHandleRef.current?.addSample(now, [accel.x, accel.y, accel.z])
    magHandleRef.current?.addSample(now, [mag.x, mag.y, mag.z])
    baroHandleRef.current?.addSample(now, [baroAlt])
  }, [send]), 50)

  return <TabView title='Status' nosave onLoad={onLoad} onReset={onReset}>
    <Row>
      <Col>
        <Card className='mb-2'>
          <Card.Header>Gyro [deg/s] ({radToDeg(sensors.gyro.x).toFixed(2)}, {radToDeg(sensors.gyro.y).toFixed(2)}, {radToDeg(sensors.gyro.z).toFixed(2)})</Card.Header>
          <Card.Body>
            <RealtimeChart data={gyroInitialData} options={gyroChartOptions} ref={gyroHandleRef} />
          </Card.Body>
        </Card>

        <Card className='mb-2'>
          <Card.Header>Accelerometer [m/s^2] ({sensors.accel.x.toFixed(2)}, {sensors.accel.y.toFixed(2)}, {sensors.accel.z.toFixed(2)})</Card.Header>
          <Card.Body>
            <RealtimeChart data={acceInitialData} options={accelChartOptions} ref={accelHandleRef} />
          </Card.Body>
        </Card>

        <Card className='mb-2'>
          <Card.Header>Magnetometer [Gaus] ({sensors.mag.x.toFixed(2)}, {sensors.mag.y.toFixed(2)}, {sensors.mag.z.toFixed(2)})</Card.Header>
          <Card.Body>
            <RealtimeChart data={magInitialData} options={magChartOptions} ref={magHandleRef} />
          </Card.Body>
        </Card>

        <Card className='mb-2'>
          <Card.Header>Altitude [m] ({sensors.baroAlt.toFixed(2)})</Card.Header>
          <Card.Body>
            <RealtimeChart data={baroInitialData} options={baroChartOptions} ref={baroHandleRef} />
          </Card.Body>
        </Card>

      </Col>
    </Row>

  </TabView>
}

export default ChartsTab
