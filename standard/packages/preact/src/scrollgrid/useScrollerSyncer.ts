import { type Ref, type RefObject, useLayoutEffect, useRef } from 'react'
import { ScrollerInterface } from './scroller-types'
import { ScrollerSyncerInterface } from './scroller-types'
import { getScrollerSyncerClass } from './layout-options'
import { setRef } from '../util/vdom'
import { useLatest } from '../hooks/useLatest'
import { useViewContext } from '../context/useViewContext'

/*
Keeps the given scrollers' scroll positions in sync along one axis. The syncer is created in a
layout effect and destroyed on cleanup, and its scrollers are refreshed after every commit. It's
exposed through `outRef`, which is cleared on cleanup. See planning/hook-toolkit-spec.md §4.4
*/
export function useScrollerSyncer(
  isHorizontal: boolean,
  scrollerRefs: RefObject<ScrollerInterface | null>[],
  outRef?: Ref<ScrollerInterface>,
): void {
  const { pluginHooks } = useViewContext()
  const syncerRef = useRef<ScrollerSyncerInterface | null>(null)
  const outRefRef = useLatest(outRef)

  useLayoutEffect(() => {
    const ScrollerSyncer = getScrollerSyncerClass(pluginHooks)
    const syncer = new ScrollerSyncer(isHorizontal)
    const exposedTo = outRefRef.current

    syncerRef.current = syncer
    setRef(exposedTo, syncer)

    return () => {
      syncer.destroy()
      syncerRef.current = null
      setRef(exposedTo, null)
    }
  }, [])

  // after the creating effect, so the first commit has a syncer
  useLayoutEffect(() => {
    syncerRef.current.handleChildren(scrollerRefs.map((scrollerRef) => scrollerRef.current))
  })
}
