import { Duration } from '@fullcalendar/preact/public-api'
import {
  afterSize,
  debounce,
  getIsHeightAuto,
  ScrollerSyncerInterface,
  setRef,
  type DateProfile,
  type ViewContext,
} from '@fullcalendar/preact/protected-api'
import { type Ref, type RefObject, useLayoutEffect, useRef, useState } from 'react'
import { findEntityByCoord } from '@full-ui/headless-grid'
import { createEntityId, type Group } from '../resource/common/resource-hierarchy'
import { type Resource } from '../resource/structs/resource'
import { type TimelineDateProfile } from '../timeline/timeline-date-profile'
import { type GenericLayout } from './resource-layout'
import { timeToCoord } from '../timeline/timeline-positioning'
import { ESTIMATED_SLOT_WIDTH } from '../timeline/slot-estimate'
import { Virtualizer } from './virtual/virtualizer'
import { type WindowScrollTracker } from './useWindowScrollTracking'

export interface EntityScroll {
  entityId?: string
  fromBottom?: number
}

export interface TimeScroll {
  time?: Duration
  x?: number
}

/*
What the layout computed in its latest render, for the handlers. Written during render, as the class
kept it on the instance, because the virtualizers (render-time caches) read it while rendering too
*/
export interface ResourceTimelineGeometry {
  props: {
    dateProfile: DateProfile
    tDateProfile: TimelineDateProfile
    slotWidth: number | undefined
    timeCanvasWidth: number | undefined
  }
  bodyLayouts: GenericLayout<Resource | Group>[]
  bodyTops: Map<string, number> // keyed by createEntityId
  bodyHeights: Map<string, number> // keyed by createEntityId
  maxVScroll: number | undefined
  maxHScroll: number | undefined
  headerHeight: number | undefined // the layout's, for skipping re-renders that wouldn't change it
}

export interface ResourceTimelineSyncers {
  time: ScrollerSyncerInterface | null // horizontal: header, body, footer
  body: ScrollerSyncerInterface | null // vertical: spreadsheet body, time body
  spreadsheet: ScrollerSyncerInterface | null // horizontal: header, body, footer
}

export interface ResourceTimelineVirtualizers {
  row: Virtualizer<any>
  slot: Virtualizer<string>
  groupCols: Virtualizer<any>[]
  timeHeaders: Virtualizer<any>[]
}

export interface ResourceTimelineScrollInput {
  geometryRef: RefObject<ResourceTimelineGeometry> // written during render, read by the handlers
  syncers: ResourceTimelineSyncers // created by the layout's mount effect, which runs before this hook's
  virtualizers: ResourceTimelineVirtualizers
  windowTracker: WindowScrollTracker
  rerender: () => void // re-renders the layout now
  initialScroll: (TimeScroll & EntityScroll) | undefined | null
  scrollRef: Ref<TimeScroll & EntityScroll> | undefined
  context: ViewContext
  // what a commit changed, for re-applying the time scroll
  timeScrollKeys: unknown[] // dateProfile, slotWidth, timeCanvasWidth, timeClientWidth
}

const DEFAULT_OWN_CELL_HEIGHT = 40

/*
ResourceTimeline's scroll: one target, `{ time, x }` and `{ entityId, fromBottom }`, updated in place
and reported to the view's scrollRef, which survives print (print clips to x, and the layout restores
the target from initialScroll on each mount, <Activity> and Strict Mode included).

Time: time wins over x. Every scroll (programmatic too) records x and moves the slot and time-header
virtualizers, debounced. Entity: the resource at the scroll position, recorded when a body scroll
ends. While scrolling, row height changes above the viewport become "slack", so the content doesn't
jump, consumed when scrolling ends or reaches it.
See planning/phase-7-resource-timeline-plan.md
*/
export function useResourceTimelineScroll(input: ResourceTimelineScrollInput) {
  const inputRef = useRef(input) // assigned during render: the handlers also run from children's commits
  inputRef.current = input
  const isActiveRef = useRef(true) // until unmount. children report row heights from their layout effects

  const [ctrl] = useState(() => {
    const getIsVerticalScrolling = () => !getIsHeightAuto(inputRef.current.context.options)

    const ctrl = {
      scroll: {} as TimeScroll & EntityScroll, // updated in place. the object the view's scrollRef holds
      scrollSlack: 0, // extra space added to rows above the viewport while scrolling. body scroller only
      queuedEntityScroll: false,
      isScrolling: false,
      currentEntityScroll: 0, // pixels
      afterRender: null as (() => void) | null, // a scroll waiting for the re-render the slack needs

      // Entity scrolling
      // ---------------------------------------------------------------------------------------------

      // recomputes row positioning when the row height maps change
      handleBodyRowHeightChange(val: number | null, key: string, oldVal: number | null) {
        if (!isActiveRef.current) {
          return
        }

        const { geometryRef, syncers, rerender } = inputRef.current

        if (ctrl.isScrolling) {
          if (val != null) {
            const scrollSlackDelta = (oldVal ?? DEFAULT_OWN_CELL_HEIGHT) - val
            if (scrollSlackDelta) {
              const topCoord = geometryRef.current.bodyTops.get(key)
              // Live scroll position, because currentEntityScroll lags when the browser clamps the
              // scroll after content shrinks, and its scroll event hasn't fired yet
              if (topCoord != null && topCoord < syncers.body.y) {
                if (getIsVerticalScrolling()) {
                  ctrl.scrollSlack += scrollSlackDelta
                }
              }
            }
          }
        } else {
          ctrl.queuedEntityScroll = true
        }

        afterSize(rerender)
      },

      handleAnyEntityScroll(scroll: number) {
        ctrl.currentEntityScroll = scroll
        updateVirtualizerScroll[0]()
      },

      // REQUESTED scroll by external systems (for the body scroller only, NOT window)
      handleResourceScrollRequest(resourceId: string) {
        ctrl.scroll.entityId = resourceId
        ctrl.scroll.fromBottom = undefined

        // The resource might not be rendered yet, such as when added within batchRendering. Otherwise
        // render would virtualize rows around the requested scroll without ever applying it
        if (!ctrl.applyEntityScroll()) {
          ctrl.queuedEntityScroll = true
        }
      },

      // START vertical scroll (for the body scroller only, NOT window)
      handleEntityScrollStart() {
        ctrl.isScrolling = true
        ctrl.scroll.entityId = undefined
        ctrl.scroll.fromBottom = undefined
      },

      // DURING vertical scroll (for the body scroller only, NOT window)
      handleEntityScroll(_isDevice: boolean, scroll: number) {
        if (getIsVerticalScrolling()) {
          ctrl.handleAnyEntityScroll(scroll)

          // natural handler for vertical scroll, for either div or window scroll
          // if scrolls into slack area, move scroll to zero ASAP
          if (scroll < ctrl.scrollSlack) {
            ctrl.scrollSlack = 0
            ctrl.afterRender = () => {
              inputRef.current.syncers.body.scrollTo({ y: 0 })
            }
            inputRef.current.rerender()
          }
        }
      },

      // END vertical scroll (for the body scroller only, NOT window)
      handleEntityScrollEnd() {
        const { geometryRef, syncers, windowTracker, rerender } = inputRef.current
        ctrl.isScrolling = false

        if (!windowTracker.isTracking) {
          const { bodyLayouts, bodyTops, bodyHeights } = geometryRef.current
          const { scroll } = ctrl
          const y = syncers.body.y

          if (!y) {
            // If already at top, keep at top. Anchoring to the first row would hide any rows that are
            // later inserted above it
            scroll.entityId = undefined
            scroll.fromBottom = undefined
          } else {
            const coordRes = findEntityByCoord(
              bodyLayouts,
              bodyTops,
              bodyHeights,
              y,
              createEntityId,
            )

            if (coordRes) {
              const [entity, elTop, elHeight] = coordRes

              scroll.entityId = createEntityId(entity)
              scroll.fromBottom = elTop + elHeight - y
            }
          }

          // At scrolling end, convert scrollSlack into real scroll and zero out
          const { scrollSlack } = ctrl
          if (scrollSlack) {
            ctrl.scrollSlack = 0
            ctrl.afterRender = () => {
              inputRef.current.syncers.body.scrollTo({ y: y - scrollSlack })
            }
            rerender()
          }
        }
      },

      // returns whether applied
      applyEntityScroll(): boolean {
        const scrollTop = ctrl.computeEntityScroll(inputRef.current.geometryRef.current)

        if (scrollTop !== undefined) {
          inputRef.current.syncers.body.scrollTo({ y: scrollTop })
          return true
        }
        return false
      },

      // also used by render, for virtualization, with that render's geometry
      computeEntityScroll(
        geometry: Pick<ResourceTimelineGeometry, 'bodyTops' | 'bodyHeights' | 'maxVScroll'>,
      ): number | undefined {
        const { bodyTops, bodyHeights, maxVScroll } = geometry
        const { entityId, fromBottom } = ctrl.scroll

        if (entityId) {
          const top = bodyTops.get(entityId)
          const height = bodyHeights.get(entityId)

          if (top != null) {
            const bottom = top + height
            const requestedScrollTop =
              fromBottom != null ?
                bottom - fromBottom : // pixels from bottom edge
                top + // just use top edge
                  (top ? 1 : 0) // overcome top border

            return Math.min(maxVScroll, requestedScrollTop)
          }
        }
      },

      /*
      HACK for the queued entity scroll after a commit.
      Runs when a drag/resize starts, and clears the last recorded entity scroll
      */
      prepareHits() {
        ctrl.scroll.entityId = undefined
        ctrl.scroll.fromBottom = undefined
      },

      // Time scrolling
      // ---------------------------------------------------------------------------------------------

      resetTimeScroll() {
        ctrl.handleTimeScrollRequest(inputRef.current.context.options.scrollTime)
      },

      handleTimeScrollRequest(timeScroll: Duration) {
        ctrl.scroll.time = timeScroll
        ctrl.applyTimeScroll()
      },

      // HACKY
      // can't use isDevice because we want programmatic .scrollLeft assignments to work with
      // scroll-virtualization too. the main reason we use a isDevice gate is to prevent the
      // initial-scroll assignment from triggering handleTimeScroll, but the debounce luckily helps
      handleTimeScroll(_isDevice: boolean, scroll: number) {
        ctrl.scroll.x = scroll
        updateTimeVirtualizerScroll[0]()
      },

      handleTimeScrollEnd() {
        setRef(inputRef.current.scrollRef, ctrl.scroll)
      },

      applyTimeScroll() {
        const x = ctrl.computeTimeScroll(inputRef.current.geometryRef.current)

        if (x !== undefined) {
          inputRef.current.syncers.time.scrollTo({ x })

          if (ctrl.scroll.x !== x) {
            ctrl.scroll.x = x
            setRef(inputRef.current.scrollRef, ctrl.scroll)
          }
        }
      },

      // also used by render, for virtualization, with that render's geometry
      computeTimeScroll(geometry: Pick<ResourceTimelineGeometry, 'props' | 'maxHScroll'>): number | undefined {
        const { props, maxHScroll } = geometry
        const { dateEnv } = inputRef.current.context
        const slotWidth = props.slotWidth ?? ESTIMATED_SLOT_WIDTH
        let { x, time } = ctrl.scroll

        if (time) {
          x = timeToCoord(time, dateEnv, props.dateProfile, props.tDateProfile, slotWidth)

          if (x) {
            x += 1 // overcome border. TODO: DRY this up
          }
        }

        if (x !== undefined && maxHScroll !== undefined) {
          x = Math.min(maxHScroll, x)
        }

        return x
      },
    }

    const updateVirtualizerScroll = debounce(() => {
      const scroll = ctrl.currentEntityScroll
      const { virtualizers } = inputRef.current

      virtualizers.row.handleScroll(scroll)

      for (const groupColVirtualizer of virtualizers.groupCols) {
        groupColVirtualizer.handleScroll(scroll)
      }
    }, 10)

    const updateTimeVirtualizerScroll = debounce(() => {
      ctrl.scroll.time = undefined // prevents computeTimeScroll from computing based on time
      const scrollX = ctrl.scroll.x
      const { virtualizers } = inputRef.current

      virtualizers.slot.handleScroll(scrollX)
      for (const timeHeaderVirtualizer of virtualizers.timeHeaders) {
        timeHeaderVirtualizer.handleScroll(scrollX)
      }
    }, 10)

    return Object.assign(ctrl, {
      cancelDebounces() {
        updateVirtualizerScroll[1]()
        updateTimeVirtualizerScroll[1]()
      },
    })
  })

  // each mount, including a shown <Activity> and a Strict Mode replay. after the syncers are created
  useLayoutEffect(() => {
    const { syncers, context, initialScroll } = inputRef.current
    isActiveRef.current = true

    if (initialScroll) {
      ctrl.scroll = { ...initialScroll } // copy
      ctrl.applyEntityScroll()
      ctrl.applyTimeScroll()
    } else {
      ctrl.resetTimeScroll()
    }

    const timeSyncer = syncers.time
    const bodySyncer = syncers.body
    timeSyncer.addScrollListener(ctrl.handleTimeScroll)
    timeSyncer.addScrollEndListener(ctrl.handleTimeScrollEnd)
    bodySyncer.addScrollStartListener(ctrl.handleEntityScrollStart)
    bodySyncer.addScrollListener(ctrl.handleEntityScroll)
    bodySyncer.addScrollEndListener(ctrl.handleEntityScrollEnd)

    const { emitter } = context
    emitter.on('_timeScrollRequest', ctrl.handleTimeScrollRequest)
    emitter.on('_resourceScrollRequest', ctrl.handleResourceScrollRequest)

    return () => {
      isActiveRef.current = false
      ctrl.cancelDebounces()
      timeSyncer.removeScrollListener(ctrl.handleTimeScroll)
      timeSyncer.removeScrollEndListener(ctrl.handleTimeScrollEnd)
      bodySyncer.removeScrollStartListener(ctrl.handleEntityScrollStart)
      bodySyncer.removeScrollListener(ctrl.handleEntityScroll)
      bodySyncer.removeScrollEndListener(ctrl.handleEntityScrollEnd)
      emitter.off('_timeScrollRequest', ctrl.handleTimeScrollRequest)
      emitter.off('_resourceScrollRequest', ctrl.handleResourceScrollRequest)
    }
  }, [])

  // every commit after the first, like componentDidUpdate
  const prevKeysRef = useRef<unknown[] | null>(null)
  useLayoutEffect(() => {
    const { timeScrollKeys, context } = inputRef.current
    const prevKeys = prevKeysRef.current
    prevKeysRef.current = timeScrollKeys

    if (prevKeys) {
      const dateProfileChange = prevKeys[0] !== timeScrollKeys[0]
      const anyChange = timeScrollKeys.some((key, i) => key !== prevKeys[i])

      if (anyChange) {
        if (dateProfileChange && context.options.scrollTimeReset) {
          ctrl.resetTimeScroll()
        } else {
          ctrl.applyTimeScroll()
        }
      }

      /*
      Unfortunately this will execute after auto-scroll finished but before scrollEnd can record
      the updated scroll positioning, causing a scroll-jump to the last recorded entityScroll.
      */
      if (ctrl.queuedEntityScroll) {
        ctrl.queuedEntityScroll = false
        ctrl.applyEntityScroll()
      }
    }

    // a scroll that waited for this render (the class's forceUpdate callback)
    const { afterRender } = ctrl
    if (afterRender) {
      ctrl.afterRender = null
      afterRender()
    }
  })

  return ctrl
}

export type ResourceTimelineScroll = ReturnType<typeof useResourceTimelineScroll>
