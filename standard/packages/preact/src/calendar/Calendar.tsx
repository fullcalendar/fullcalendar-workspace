import React, {
  PropsWithoutRef,
  Ref,
  FunctionComponent,
  forwardRef,
  useState,
  useImperativeHandle,
} from 'react'
import { flushSync } from 'react-dom'
import { createCalendarStore } from '../store/CalendarStore'
import { CalendarOptions } from '../options/options'
import { CalendarApiImpl } from '../api/CalendarApiImpl'
import { CalendarApi } from '../api/CalendarApi'
import { CalendarMediaRoot, computeRootClassName } from './CalendarMediaRoot'
import { CalendarInner } from './CalendarInner'
import { guid } from '../util/misc'
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { warn } from '../util/warn'

export interface CalendarRef {
  getApi(): CalendarApi
}

type CalendarPropsInternal = CalendarOptions & { id?: string }
export type CalendarProps = PropsWithoutRef<CalendarPropsInternal> & { ref?: Ref<CalendarRef> }

export const Calendar: FunctionComponent<CalendarProps> = forwardRef<CalendarRef, CalendarPropsInternal>((props, ref) => {
  const baseId = useStableId(props.id) // for DOM ids

  const [_revision, setRevision] = useState('')

  // created together, so a Strict Mode replay of this initializer discards both
  const [{ calendarApi, store }] = useState(() => {
    const calendarApi = new CalendarApiImpl()
    const store = createCalendarStore({
      calendarApi,
      isMountGated: true, // a render might never commit
    })

    // before mount(), which may deliver changes held while not mounted
    store.subscribe(({ isUrgent, isInCommit }) => {
      // inside a commit, React renders the state change synchronously anyway, and forbids flushSync
      (isUrgent && !isInCommit ? flushSync : runNormal)(() => {
        setRevision(guid())
      })
    })

    return { calendarApi, store }
  })

  // timers, and data changes from async work (fetches), only while mounted.
  // runs again for remounts from Strict Mode and <Activity>
  useIsomorphicLayoutEffect(() => {
    store.mount()
    return () => {
      store.unmount()
    }
  }, [])

  // effects queued by the render, like the `loading` callback
  useIsomorphicLayoutEffect(() => {
    // CalendarInner syncs first, before it emits datesSet (its layout effect runs before this, its
    // parent's, in both runtimes), so this is a no-op unless something rebound the controller between
    data.syncController(data.calendarOptions.controller)
    store.flushEffects()
  })

  useImperativeHandle(ref, () => ({
    getApi: () => calendarApi
  }), [])

  const data = store.update(props, /* isRendering = */ true)

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
