import { PropsWithoutRef, Ref, FunctionComponent } from 'react'
import { CalendarDataManager } from './reducers/CalendarDataManager'
import { CalendarOptions } from './options'
import { CalendarApiImpl } from './api/CalendarApiImpl'
import { CalendarApi } from './api/CalendarApi'
import { CalendarData } from './reducers/data-types'
import { forwardRef, useId, useRef, useState, useEffect, useCallback, useMemo, useImperativeHandle } from 'react'
import { CalendarMediaRoot, computeRootClassName } from './calendar-root'
import { CalendarInner } from './CalendarInner'
import { memoize } from './util/memoize'

export interface CalendarRef {
  getApi(): CalendarApi
}

export const Calendar: FunctionComponent<PropsWithoutRef<CalendarOptions> & { ref?: Ref<CalendarRef> }> = forwardRef<CalendarRef, CalendarOptions>((props, ref) => {
  const baseId = useId()
  const apiRef = useRef(new CalendarApiImpl())
  const dataManagerRef = useRef<CalendarDataManager | undefined>(undefined)
  const [currentData, setCurrentData] = useState<CalendarData | undefined>(undefined)
  const inRenderRef = useRef(false)
  const computeRootClassNameMemo = useMemo(() => memoize(computeRootClassName), [])

  // Expose getApi() via ref
  useImperativeHandle(ref, () => ({
    getApi: () => apiRef.current
  }), [])

  // Handle data updates
  const handleData = useCallback((data: CalendarData) => {
    setCurrentData(data)
  }, [])

  // Initialize/update data manager
  inRenderRef.current = true
  if (!dataManagerRef.current) {
    dataManagerRef.current = new CalendarDataManager({
      optionOverrides: props,
      calendarApi: apiRef.current,
      onData: handleData,
    })
  } else {
    dataManagerRef.current.resetOptions(props)
  }
  inRenderRef.current = false

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dataManagerRef.current?.destroy()
    }
  }, [])

  if (!currentData) return null

  return (
    <CalendarMediaRoot emitter={currentData.emitter}>
      {(forPrint: boolean) => {
        const options = currentData.calendarOptions
        const isRtl = options.direction === 'rtl'
        const className = computeRootClassNameMemo(options, forPrint)

        return (
          <div
            dir={isRtl ? 'rtl' : undefined}
            className={className}
            style={{ height: options.height }}
          >
            <CalendarInner {...currentData} baseId={baseId} forPrint={forPrint} />
          </div>
        )
      }}
    </CalendarMediaRoot>
  )
})
