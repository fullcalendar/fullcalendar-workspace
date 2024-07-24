import {
  MoreLinkContainer,
  BaseComponent,
  memoize,
  DateMarker,
  Dictionary,
  DateProfile,
  DateRange,
  EventSegUiInteractionState,
  getSegMeta,
} from '@fullcalendar/core/internal'
import { createElement, RefObject, Fragment } from '@fullcalendar/core/preact'
import { NewTableSegPlacement } from '../event-placement.js'
import { hasListItemDisplay } from '../event-rendering.js'
import { DayGridBlockEvent } from './DayGridBlockEvent.js'
import { DayGridListEvent } from './DayGridListEvent.js'
import { TableSeg } from '../TableSeg.js'

export interface DayGridMoreLinkProps {
  allDayDate: DateMarker
  segPlacements: NewTableSegPlacement[]
  moreCnt: number
  alignmentElRef: RefObject<HTMLElement>
  alignGridTop: boolean // for popover
  extraDateSpan?: Dictionary
  dateProfile: DateProfile
  todayRange: DateRange
  eventSelection: string
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
}

export class DayGridMoreLink extends BaseComponent<DayGridMoreLinkProps> {
  compileSegs = memoize(compileSegs)

  render() {
    let { props } = this
    let { allSegs, invisibleSegs } = this.compileSegs(props.segPlacements)

    return (
      <MoreLinkContainer
        elClasses={['fc-daygrid-more-link']}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        allDayDate={props.allDayDate}
        moreCnt={props.moreCnt}
        allSegs={allSegs}
        hiddenSegs={invisibleSegs}
        alignmentElRef={props.alignmentElRef}
        alignGridTop={props.alignGridTop}
        extraDateSpan={props.extraDateSpan}
        popoverContent={() => {
          let isForcedInvisible =
            (props.eventDrag ? props.eventDrag.affectedInstances : null) ||
            (props.eventResize ? props.eventResize.affectedInstances : null) ||
            {}
          return (
            <Fragment>
              {allSegs.map((seg) => {
                let instanceId = seg.eventRange.instance.instanceId
                return (
                  <div
                    className="fc-daygrid-event-harness"
                    key={instanceId}
                    style={{
                      visibility: isForcedInvisible[instanceId] ? 'hidden' : ('' as any),
                    }}
                  >
                    {hasListItemDisplay(seg) ? (
                      <DayGridListEvent
                        seg={seg}
                        isDragging={false}
                        isSelected={instanceId === props.eventSelection}
                        defaultDisplayEventEnd={false}
                        {...getSegMeta(seg, props.todayRange)}
                      />
                    ) : (
                      <DayGridBlockEvent
                        seg={seg}
                        isDragging={false}
                        isResizing={false}
                        isDateSelecting={false}
                        isSelected={instanceId === props.eventSelection}
                        defaultDisplayEventEnd={false}
                        {...getSegMeta(seg, props.todayRange)}
                      />
                    )}
                  </div>
                )
              })}
            </Fragment>
          )
        }}
      />
    )
  }
}

function compileSegs(segPlacements: NewTableSegPlacement[]): {
  allSegs: TableSeg[]
  invisibleSegs: TableSeg[]
} {
  let allSegs: TableSeg[] = []
  let invisibleSegs: TableSeg[] = []

  for (let segPlacement of segPlacements) {
    allSegs.push(segPlacement.seg)

    if (segPlacement.top == null) {
      invisibleSegs.push(segPlacement.seg)
    }
  }

  return { allSegs, invisibleSegs }
}
