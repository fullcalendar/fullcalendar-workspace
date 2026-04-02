import {
  PropsWithoutRef,
  Ref,
  FunctionComponent,
  forwardRef,
  useId,
  useState,
  useEffect,
  useImperativeHandle,
} from 'react'
import { flushSync } from 'react-dom'
import { CalendarDataManager } from './reducers/CalendarDataManager'
import { CalendarOptions } from './options'
import { CalendarApiImpl } from './api/CalendarApiImpl'
import { CalendarApi } from './api/CalendarApi'
import { CalendarMediaRoot, computeRootClassName } from './calendar-root'
import { CalendarInner } from './CalendarInner'
import { CalendarData } from './reducers/data-types'
import { Action } from './reducers/Action'
import { guid } from './util/misc'

export interface CalendarRef {
  getApi(): CalendarApi
}

type CalendarPropsInternal = CalendarOptions & { id?: string }
export type CalendarProps = PropsWithoutRef<CalendarPropsInternal> & { ref?: Ref<CalendarRef> }

export const Calendar: FunctionComponent<CalendarProps> = forwardRef<CalendarRef, CalendarPropsInternal>((props, ref) => {
  const baseId = useStableId(props.id) // for DOM ids

  const [_revision, setRevision] = useState('')

  function handleDataChange(_data: CalendarData, actions: Action[]) {
    (needsSyncRender(actions) ? flushSync : runNormal)(() => {
      setRevision(guid())
    })
  }

  const [calendarApi] = useState(() => new CalendarApiImpl())
  const [calendarDataManager] = useState(() => new CalendarDataManager({
    calendarApi,
    onDataChange: handleDataChange,
  }))

  useEffect(() => { // Cleanup on unmount
    return () => {
      calendarDataManager.destroy()
    }
  }, [])

  useImperativeHandle(ref, () => ({
    getApi: () => calendarApi
  }), [])

  const data = calendarDataManager.update(props)

  return (
    <CalendarMediaRoot emitter={data.emitter}>
      {(forPrint: boolean) => {
        const options = data.calendarOptions
        const isRtl = options.direction === 'rtl'
        const className = computeRootClassName(options, forPrint)

        return (
          <div
            dir={isRtl ? 'rtl' : undefined}
            className={className}
            style={{ height: options.height }}
            data-color-scheme={options.colorScheme || undefined}
          >
            <CalendarInner {...data} baseId={baseId} forPrint={forPrint} />
          </div>
        )
      }}
    </CalendarMediaRoot>
  )
})

function needsSyncRender(actions: Action[]): boolean {
  for (const action of actions) {
    if (action.type === 'SET_EVENT_DRAG' || action.type === 'SET_EVENT_RESIZE') {
      return true
    }
  }
  return false
}

function runNormal(f: () => void) {
  f()
}

function useStableId(fallbackId: string | undefined): string {
  // React >= 18
  if (useId) {
    return useId()
  }

  // React 17
  if (fallbackId) {
    return fallbackId + ':'
  }
  console.warn('FullCalendar recommends providing an `id` prop for better SSR support in React 17')
  return `fc:${guid()}:`
}
