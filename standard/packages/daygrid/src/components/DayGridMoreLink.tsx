import {
  MoreLinkContainer,
  BaseComponent,
  DateMarker,
  Dictionary,
  DateProfile,
  DateRange,
  EventSegUiInteractionState,
  getEventRangeMeta,
  SlicedCoordRange,
} from '@fullcalendar/core/internal'
import { createElement, RefObject, Fragment } from '@fullcalendar/core/preact'
import { hasListItemDisplay } from '../event-rendering.js'
import { DayGridBlockEvent } from './DayGridBlockEvent.js'
import { DayGridListEvent } from './DayGridListEvent.js'
import { DayRowEventRange, DayRowEventRangePart } from '../TableSeg.js'

export interface DayGridMoreLinkProps {
  allDayDate: DateMarker
  segs: DayRowEventRangePart[]
  hiddenSegs: DayRowEventRange[]
  alignElRef: RefObject<HTMLElement>
  alignParentTop: string // for popover
  dateSpanProps?: Dictionary
  dateProfile: DateProfile
  todayRange: DateRange
  eventSelection: string
  eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null
  eventResize: EventSegUiInteractionState<SlicedCoordRange> | null
}

export class DayGridMoreLink extends BaseComponent<DayGridMoreLinkProps> {
  render() {
    let { props } = this
    return (
      <MoreLinkContainer
        className='fc-daygrid-more-link'
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        allDayDate={props.allDayDate}
        segs={props.segs}
        hiddenSegs={props.hiddenSegs}
        alignElRef={props.alignElRef}
        alignParentTop={props.alignParentTop}
        dateSpanProps={props.dateSpanProps}
        popoverContent={() => {
          let forcedInvisibleMap = // TODO: more convenient/DRY
            (props.eventDrag ? props.eventDrag.affectedInstances : null) ||
            (props.eventResize ? props.eventResize.affectedInstances : null) ||
            {}

          return (
            <Fragment>
              {props.segs.map((seg) => {
                let { eventRange } = seg
                let { instanceId } = eventRange.instance

                return (
                  <div
                    key={instanceId}
                    style={{
                      visibility: forcedInvisibleMap[instanceId] ? 'hidden' : '',
                    }}
                  >
                    {hasListItemDisplay(seg) ? (
                      <DayGridListEvent
                        eventRange={eventRange}
                        isStart={seg.isStart}
                        isEnd={seg.isEnd}
                        isDragging={false}
                        isSelected={instanceId === props.eventSelection}
                        defaultDisplayEventEnd={false}
                        {...getEventRangeMeta(eventRange, props.todayRange)}
                      />
                    ) : (
                      <DayGridBlockEvent
                        eventRange={eventRange}
                        isStart={seg.isStart}
                        isEnd={seg.isEnd}
                        isDragging={false}
                        isResizing={false}
                        isDateSelecting={false}
                        isSelected={instanceId === props.eventSelection}
                        defaultDisplayEventEnd={false}
                        {...getEventRangeMeta(eventRange, props.todayRange)}
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
