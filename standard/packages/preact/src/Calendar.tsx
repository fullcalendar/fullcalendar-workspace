import React, {
  PropsWithoutRef,
  Ref,
  FunctionComponent,
  forwardRef,
  useState,
  useEffect,
  useLayoutEffect,
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
import { warn } from './util/warn'

export interface CalendarRef {
  getApi(): CalendarApi
}

type CalendarPropsInternal = CalendarOptions & { id?: string }
export type CalendarProps = PropsWithoutRef<CalendarPropsInternal> & { ref?: Ref<CalendarRef> }

export const Calendar: FunctionComponent<CalendarProps> = forwardRef<CalendarRef, CalendarPropsInternal>((props, ref) => {
  const baseId = useStableId(props.id) // for DOM ids

  const [_revision, setRevision] = useState('')

  function handleDataChange(_data: CalendarData, actions: Action[], isInCommit: boolean) {
    // inside a commit, React renders the state change synchronously anyway, and forbids flushSync
    (needsSyncRender(actions) && !isInCommit ? flushSync : runNormal)(() => {
      setRevision(guid())
    })
  }

  const [calendarApi] = useState(() => new CalendarApiImpl())
  const [calendarDataManager] = useState(() => new CalendarDataManager({
    calendarApi,
    onDataChange: handleDataChange,
    isMountGated: true, // a render might never commit
  }))

  // timers, and data changes from async work (fetches), only while mounted.
  // runs again for remounts from Strict Mode and <Activity>
  useIsomorphicLayoutEffect(() => {
    calendarDataManager.mount()
    return () => {
      calendarDataManager.unmount()
    }
  }, [])

  // effects queued by the render, like the `loading` callback
  useIsomorphicLayoutEffect(() => {
    // CalendarInner also syncs, before it emits datesSet. this one is for Preact, which runs all
    // layout effects, including a parent's that might use the controller, before componentDidMount
    data.syncController(data.calendarOptions.controller)
    calendarDataManager.flushEffects()
  })

  useImperativeHandle(ref, () => ({
    getApi: () => calendarApi
  }), [])

  const data = calendarDataManager.update(props, /* isRendering = */ true)

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

// avoids React 17/18's warning about layout effects when server-side rendering
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

function needsSyncRender(actions: Action[]): boolean {
  for (const action of actions) {
    if (
      action.type === 'SET_EVENT_DRAG' ||
      action.type === 'UNSET_EVENT_DRAG' ||
      action.type === 'SET_EVENT_RESIZE' ||
      action.type === 'UNSET_EVENT_RESIZE' ||
      // could happen as a result of a drag or resize and must be part of same sync pipeline
      action.type === 'MERGE_EVENTS'
    ) {
      return true
    }
  }
  return false
}

function runNormal(f: () => void) {
  f()
}

let warnedStableId = false

function useStableId(fallbackId: string | undefined): string {
  // React >= 18
  // During runtime, will not change
  if (React.useId) {
    return React.useId()
  }

  // Must always execute, regardless of fallbackId, because of hook rules
  const [uid] = useState(() => guid())

  if (fallbackId) {
    return fallbackId + ':'
  }

  if (!warnedStableId) {
    warnedStableId = true
    warn('Missing `id` prop. Provide one for better SSR support in React 17.')
  }

  return `fc:${uid}:`
}
