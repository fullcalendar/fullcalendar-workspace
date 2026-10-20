import { type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { Hit } from '../interactions/hit'
import { HitTarget } from '../interactions/hit-target'
import { guid } from '../util/misc'
import { ViewContext } from '../ViewContext'
import { useLatest } from './useLatest'
import { useViewContext } from './useViewContext'

export interface HitSource {
  queryHit?: (isRtl: boolean, positionLeft: number, positionTop: number, elWidth: number, elHeight: number) => Hit | null
  prepareHits?: () => void
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
  eventSelection?: string
  eventDrag?: unknown
  eventResize?: unknown
  useEventCenter?: boolean // read when the element registers
  disableHits?: boolean // read when the element registers
}

interface Registration {
  el: HTMLElement
  unregisterHitTarget: ViewContext['unregisterHitTarget']
}

/*
Registers the element as a droppable area for interactions: date clicking and selecting, event
dragging and resizing, event clicking and hovering. Everything but the element, useEventCenter and
disableHits is read from the latest committed render, so the functions needn't be stable.
Registers in a layout effect, again whenever the element changes, and unregisters on cleanup, which
includes a hidden <Activity>. See planning/hook-toolkit-spec.md §5.4
*/
export function useHitTarget(elRef: RefObject<HTMLElement | null>, source: HitSource): void {
  const context = useViewContext()
  const latestRef = useLatest({ source, context })
  const [uid] = useState(guid)
  const registrationRef = useRef<Registration | null>(null)

  function unregister() {
    const registration = registrationRef.current

    if (registration) {
      registrationRef.current = null
      registration.unregisterHitTarget(uid)
    }
  }

  function syncRegistration() {
    const el = elRef.current

    if (el !== registrationRef.current?.el) {
      unregister()

      if (el) {
        const { source, context } = latestRef.current
        registrationRef.current = { el, unregisterHitTarget: context.unregisterHitTarget }
        context.registerHitTarget(buildHitTarget(uid, el, source, latestRef))
      }
    }
  }

  useLayoutEffect(() => {
    syncRegistration()
    return unregister
  }, [])

  useLayoutEffect(syncRegistration)
}

function buildHitTarget(
  uid: string,
  el: HTMLElement,
  initialSource: HitSource,
  latestRef: RefObject<{ source: HitSource, context: ViewContext }>,
): HitTarget {
  return {
    uid,
    el,
    useEventCenter: initialSource.useEventCenter ?? true,
    disableHits: initialSource.disableHits ?? false,
    get context() {
      return latestRef.current.context
    },
    get eventSelection() {
      return latestRef.current.source.eventSelection
    },
    get isEventInteracting() {
      const { source } = latestRef.current
      return Boolean(source.eventDrag || source.eventResize)
    },
    get isHitComboAllowed() {
      return latestRef.current.source.isHitComboAllowed || null
    },
    prepareHits() {
      latestRef.current.source.prepareHits?.()
    },
    queryHit(isRtl, positionLeft, positionTop, elWidth, elHeight) {
      const { queryHit } = latestRef.current.source
      return queryHit ? queryHit(isRtl, positionLeft, positionTop, elWidth, elHeight) : null
    },
  }
}
