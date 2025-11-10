import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  //TimeScale,
  //Tooltip,
  //CategoryScale,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'

// https://www.chartjs.org/docs/latest/getting-started/installation.html

Chart.register(
  LineElement,
  PointElement,
  LinearScale,
  //TimeScale,
  //CategoryScale,
  //Tooltip,
  Legend,
)

type RealTimeChartProps = {
  data: ChartData<"line">
  options: ChartOptions<"line">
}

export type RealTimeChartRef = {
  addSample: (dt: number, values: number[]) => void
}

const RealtimeChart = forwardRef<RealTimeChartRef, RealTimeChartProps>(({ data, options }, ref) => {
  const chartRef = useRef<Chart<"line">>(null)
  const startTimeRef = useRef<number>(0)

  useImperativeHandle(ref, () => ({
    addSample(dt: number, values: number[]) {
      const chart = chartRef.current
      if (!chart) return
      const ttl = 30000
      const now = Date.now() - startTimeRef.current

      values.forEach((v, i) => {
        const data = chart.data.datasets[i].data as { x: number, y: number }[]
        data.push({ x: dt - startTimeRef.current, y: v });
        chart.data.datasets[i].data = data.filter(p => now - p.x <= ttl)
      })

      const data = chart.data.datasets[0].data as { x: number, y: number }[]
      const x = data.map(p => p.x)
      chart.options.scales!.x!.min = now - ttl
      chart.options.scales!.x!.max = x[x.length-1]
      
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
    <div style={{ width: "100%", height: "200px" }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  )
})

export default RealtimeChart
