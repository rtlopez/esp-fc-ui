import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useMsp } from '@/api/msp/MspProvider'
import { useIntervalMsp } from '@/api/hook/useIntervalMsp'
import { Card, Col, Row } from 'react-bootstrap'
import TabView from './TabView'
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CategoryScale,
  ChartOptions,
  ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import { createSensorsRequest, EspSensorsResponse, parseSensorsResponse } from '@/api/esp'

// https://www.chartjs.org/docs/latest/getting-started/installation.html

Chart.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend,
  //  streamingPlugin,
);

const accelChartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  scales: {
    x: {
      type: "linear",
      title: { display: true, text: "Time", color: "white" },
      ticks: {
        color: "white",
        callback: (value: string | number) => {
          if (typeof value === 'string') value = parseInt(value, 10)
          return  ((value / 2000) * 2).toFixed(0)
        },
      },
      grid: {
        color: "rgba(200,200,200,0.3)", // szary odcień
      },
    },
    y: {
      title: { display: true, text: "Value" },
      ticks: {
        color: "white",
      },
      grid: {
        color: "rgba(200,200,200,0.3)",
      },
      min: -26,
      max: 26,
    },
  },
  plugins: {
    legend: { display: true, labels: { color: 'white' } },
    tooltip: { enabled: false },
  }
}

const acceInitialData: ChartData<"line"> = {
  labels: [],
  datasets: [
    {
      label: "Roll",
      data: [],
      borderColor: "red",
      borderWidth: 1,
      tension: 0,
      pointRadius: 0,
    },
    {
      label: "Pitch",
      data: [],
      borderColor: "lightgreen",
      borderWidth: 1,
      tension: 0,
      pointRadius: 0,
    },
    {
      label: "Yaw",
      data: [],
      borderColor: "#2dace3",
      borderWidth: 1,
      tension: 0,
      pointRadius: 0,
    },
  ],
}

type RealTimeChartProps = {
  initialData: ChartData<"line">
  options: ChartOptions<"line">
}

type RealTimeChartRef = {
  addSample: (dt: number, values: number[]) => void
}

const RealtimeChart = forwardRef<RealTimeChartRef, RealTimeChartProps>(({ initialData, options }, ref) => {
  const chartRef = useRef<Chart<"line">>(null)
  const startTimeRef = useRef<number>(0)
  useImperativeHandle(ref, () => ({
    addSample(dt: number, values: number[]) {
      const chart = chartRef.current
      if (!chart) return
      const ttl = 15000
      const now = Date.now() - startTimeRef.current

      //let yMin, yMax
      values.forEach((v, i) => {
        const data = chart.data.datasets[i].data as { x: number, y: number }[]
        data.push({ x: dt - startTimeRef.current, y: v });
        chart.data.datasets[i].data = data.filter(p => now - p.x <= ttl)

        //const y = data.map(p => p.y)
        //yMin = Math.min(...y)
        //yMax = Math.max(...y)
      })

      const data = chart.data.datasets[0].data as { x: number, y: number }[]
      const x = data.map(p => p.x)
      chart.options.scales!.x!.min = now - ttl
      chart.options.scales!.x!.max = x[x.length-1]
      
      // if(chart.options.scales!.y!.min !== undefined) yMin = Math.min(yMin, +chart.options.scales!.y!.min)
      // if(chart.options.scales!.y!.max !== undefined) yMax = Math.max(yMax, +chart.options.scales!.y!.max)
      // chart.options.scales!.y!.min = yMin
      // chart.options.scales!.y!.max = yMax

      chart.update('none')
    },
  }))
  useEffect(() => {
    startTimeRef.current = Date.now()
    const ref = chartRef.current
    return () => {
      ref?.destroy()
    };
  }, [])
  return (
    <div style={{ width: "100%", height: "250px" }}>
      <Line ref={chartRef} data={initialData} options={options} />
    </div>
  )
})

const ChartsTab = () => {

  const { send } = useMsp()

  const [ sensors, setSensors ] = useState<EspSensorsResponse>({
    gyro: {x: 0, y: 0, z: 0},
    accel: {x: 0, y: 0, z: 0},
    mag: {x: 0, y: 0, z: 0},
    baroAlt: 0,
  })

  const handleRef = useRef<RealTimeChartRef>(null)

  const onLoad = useCallback(async () => {
  }, [])

  const onReset = useCallback(() => {
  }, []);

  useIntervalMsp(useCallback(async () => {
    const sensors = parseSensorsResponse(await send(createSensorsRequest()))
    setSensors(sensors)
    const a = sensors.accel
    handleRef.current?.addSample(Date.now(), [a.x, a.y, a.z])
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
        <Card>
          <Card.Header>Accelerometer [{sensors.accel.x.toFixed(1)}, {sensors.accel.y.toFixed(1)}, {sensors.accel.z.toFixed(1)}]</Card.Header>
          <Card.Body>
            <RealtimeChart initialData={acceInitialData} options={accelChartOptions} ref={handleRef} />
          </Card.Body>
        </Card>
      </Col>
    </Row>

  </TabView>
}

export default ChartsTab