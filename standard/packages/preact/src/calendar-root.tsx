import { Emitter } from './common/Emitter'
import classNames from './styles.module.css'
import { CalendarListeners, CalendarOptions } from './options'
import { useState, type ReactElement } from 'react'
import { joinClassNames } from './util/html'
import { flushSyncWithSizeBatching } from './component-util/resize-observer'
import { generateClassName } from './common/render-hook'
import { useIsomorphicLayoutEffect } from './hooks/useIsomorphicLayoutEffect'

export interface CalendarDisplayInfo {
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
}

export interface CalendarMediaRootProps {
  emitter: Emitter<Required<CalendarListeners>>
  children?: (forPrint: boolean) => ReactElement
}

// whether the calendar renders for print, between the window's beforeprint and afterprint
export function CalendarMediaRoot(props: CalendarMediaRootProps) {
  const { emitter } = props
  const [forPrint, setForPrint] = useState(false)

  // layout timing, like the componentDidMount it replaces
  useIsomorphicLayoutEffect(() => {
    const handleBeforePrint = () => {
      // The synchronous commit mounts print-only DOM during this beforeprint
      // task. Watchers registering during the bracket measure immediately, and
      // their layout recomputations settle in one batched drain before the
      // native event returns.
      flushSyncWithSizeBatching(() => {
        setForPrint(true)
      })
    }

    const handleAfterPrint = () => {
      // No synchronous commit needed: nothing else listens to _afterprint, and
      // the ordinary microtask-batched re-render restores the screen DOM before
      // the next paint. Screen watchers keep their async-first measurement.
      setForPrint(false)
    }

    emitter.on('_beforeprint', handleBeforePrint)
    emitter.on('_afterprint', handleAfterPrint)

    return () => {
      emitter.off('_beforeprint', handleBeforePrint)
      emitter.off('_afterprint', handleAfterPrint)
    }
  }, [emitter])

  return props.children ? props.children(forPrint) : null
}

export function computeRootClassName(options: CalendarOptions, forPrint: boolean): string {
  let borderlessX = options.borderlessX ?? options.borderless
  let borderlessTop = options.borderlessTop ?? options.borderless
  let borderlessBottom = options.borderlessBottom ?? options.borderless

  const calendarDisplayData: CalendarDisplayInfo = {
    borderlessX: Boolean(borderlessX),
    borderlessTop: Boolean(borderlessTop),
    borderlessBottom: Boolean(borderlessBottom),
  }

  return joinClassNames(
    generateClassName(options.class, calendarDisplayData),
    generateClassName(options.className, calendarDisplayData),
    classNames.borderBoxRoot,
    classNames.isolate,
    classNames.flexCol,
    forPrint ? classNames.calendarPrintRoot : classNames.calendarScreenRoot,
  )
}
