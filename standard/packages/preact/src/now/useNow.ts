import { useLayoutEffect, useState } from 'react'
import { NowTimerRunner, NowTimerRunnerOutput } from './NowTimerRunner'
import { useCalendarCore, useDateEnv, useViewOptions } from '../context/useGranularContexts'

/*
Now, snapped to `unit`, and today's range. Re-renders when they change. The timer runs only while
mounted: it starts in a layout effect and stops on cleanup, so a hidden <Activity>, a Strict Mode
replay or a render that never commits leaves none behind. On a remount, a change that came due while
unmounted is reported right away. See planning/hook-toolkit-spec.md §5.2
*/
export function useNow(unit: string, unitValue?: number): NowTimerRunnerOutput {
  const { nowManager } = useCalendarCore()
  const dateEnv = useDateEnv()
  const options = useViewOptions()
  const [, setRenderCount] = useState(0)
  const [runner] = useState(() => new NowTimerRunner(() => {
    setRenderCount(incrementCounter)
  }))

  // layout timing, like the componentDidMount it replaces
  useLayoutEffect(() => {
    runner.start()

    return () => {
      runner.stop()
    }
  }, [])

  return runner.update({
    nowManager,
    unit,
    unitValue,
    nowIndicatorSnap: options.nowIndicatorSnap,
    dateEnv,
  })
}

function incrementCounter(n: number): number {
  return n + 1
}
