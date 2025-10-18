import { useEffect, useRef } from "react"
import { useMsp } from "@/api/msp/MspProvider"

export const useIntervalMsp = (callback: () => Promise<void>, delay: number) => {
  const { connected, cliActive, rebooting, initialized } = useMsp()

  const timeoutRef = useRef<number>(0)
  const mounted = useRef(false)
  const executing = useRef(false)
  
  const enable = initialized && connected && !cliActive && !rebooting

  useEffect(() => {
    mounted.current = true

    const executeCallback = async () => {
      if (mounted.current && enable && !executing.current) {
        executing.current = true
        try {
          await callback()
        } catch (e) {
          console.error('Interval callback error:', e)
        } finally {
          executing.current = false
        }
      }

      // Schedule next execution only after current one is complete
      timeoutRef.current = window.setTimeout(executeCallback, delay)
    }

    // Start the cycle
    if (mounted.current && enable && !executing.current) {
      timeoutRef.current = window.setTimeout(executeCallback, delay)
    }

    return () => {
      mounted.current = false
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [callback, delay, enable])

}
