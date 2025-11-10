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
        title: { display: true, text: "Time", color: "white" },
        grid: { color: "rgba(200,200,200,0.3)" },
        ticks: {
          color: "white",
          callback: (value: string | number) => {
            value = typeof value === 'string' ? parseInt(value, 10) : value
            return ((value / 2000) * 2).toFixed(0)
          },
        },
      },
      y: {
        title: { display: true, text: "Value" },
        grid: { color: "rgba(200,200,200,0.3)" },
        ticks: { color: "white" },
        min: min,
        max: max,
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

const gyroChartOptions = makeOptions({min: -1000, max: 1000})
const gyroInitialData = makeDataSets([
  { label: 'Roll', color: 'red'},
  { label: 'Pitch', color: 'lightgreen'},
  { label: 'Yaw', color: '#2dace3'},
])

const accelChartOptions = makeOptions({min: -25, max: 25})
const acceInitialData = makeDataSets([
  { label: 'Roll', color: 'red'},
  { label: 'Pitch', color: 'lightgreen'},
  { label: 'Yaw', color: '#2dace3'},
])

const magChartOptions = makeOptions({min: -1.5, max: 1.5})
const magInitialData = makeDataSets([
  { label: 'Roll', color: 'red'},
  { label: 'Pitch', color: 'lightgreen'},
  { label: 'Yaw', color: '#2dace3'},
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
  const { send } = useMsp()

  const onLoad = useCallback(async () => {
  }, [])

  const onReset = useCallback(() => {
    setSensors(SENSORS_DEFAULTS)
  }, []);

  useIntervalMsp(useCallback(async () => {
    const sensors = parseSensorsResponse(await send(createSensorsRequest()))
    setSensors(sensors)
    const {gyro, accel, mag } = sensors
    gyroHandleRef.current?.addSample(Date.now(), [radToDeg(gyro.x), radToDeg(gyro.y), radToDeg(gyro.z)])
    accelHandleRef.current?.addSample(Date.now(), [accel.x, accel.y, accel.z])
    magHandleRef.current?.addSample(Date.now(), [mag.x, mag.y, mag.z])
  }, [send]), 50)

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     handleRef.current?.addSample(0, Date.now(), Math.random() * 500)
  //   }, 50)
  //   return () => clearInterval(interval)
  // }, [])

  return <TabView title='Status' nosave onLoad={onLoad} onReset={onReset}>
    <Row>
      <Col>
        <Card className='mb-2'>
          <Card.Header>Gyro [{radToDeg(sensors.gyro.x).toFixed(1)}, {radToDeg(sensors.gyro.y).toFixed(1)}, {radToDeg(sensors.gyro.z).toFixed(1)}]</Card.Header>
          <Card.Body>
            <RealtimeChart data={gyroInitialData} options={gyroChartOptions} ref={gyroHandleRef} />
          </Card.Body>
        </Card>

        <Card className='mb-2'>
          <Card.Header>Accelerometer [{sensors.accel.x.toFixed(1)}, {sensors.accel.y.toFixed(1)}, {sensors.accel.z.toFixed(1)}]</Card.Header>
          <Card.Body>
            <RealtimeChart data={acceInitialData} options={accelChartOptions} ref={accelHandleRef} />
          </Card.Body>
        </Card>

        <Card className='mb-2'>
          <Card.Header>Magnetometer [{sensors.mag.x.toFixed(1)}, {sensors.mag.y.toFixed(1)}, {sensors.mag.z.toFixed(1)}]</Card.Header>
          <Card.Body>
            <RealtimeChart data={magInitialData} options={magChartOptions} ref={magHandleRef} />
          </Card.Body>
        </Card>

      </Col>
    </Row>

  </TabView>
}

export default ChartsTab