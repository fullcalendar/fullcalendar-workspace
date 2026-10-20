import { useRef, useState } from 'react'

/*
State for a measurement reported through a ref: a stable setter that ignores null and repeats.
- Children report null when they unmount, and when an <Activity> hides them or Strict Mode replays
  their mount, which a plain state setter would turn into two extra renders (cleared, then measured
  again). The class components ignored it while unmounting.
- They report the same value again when shown. React can't always skip a same-value update before
  rendering (not while the component has pending work, as when an <Activity> is revealed), and would
  call the component, and its render hooks, before bailing out. The classes' shouldComponentUpdate
  stopped that
*/
export function useMeasuredState(): [number | undefined, (value: number | null) => void] {
  const [value, setValue] = useState<number | undefined>(undefined)
  const lastRef = useRef<number | undefined>(undefined)
  const [handleValue] = useState(() => (value: number | null) => {
    if (value != null && value !== lastRef.current) {
      lastRef.current = value
      setValue(value)
    }
  })
  return [value, handleValue]
}
