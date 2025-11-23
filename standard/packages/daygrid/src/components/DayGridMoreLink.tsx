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
  StandardEvent,
} from '@fullcalendar/core/internal'
import { createElement, RefObject, Fragment } from '@fullcalendar/core/preact'
import { DEFAULT_TABLE_EVENT_TIME_FORMAT, hasListItemDisplay } from '../event-rendering.js'
import { DayRowEventRange, DayRowEventRangePart } from '../TableSeg.js'

export interface DayGridMoreLinkProps {
  className?: string
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
  isNarrow: boolean
  isMicro: boolean
}

export class DayGridMoreLink extends BaseComponent<DayGridMoreLinkProps> {
  render() {
    let { props } = this

    return (
      <MoreLinkContainer
        display='row'
        className={props.className}
        isNarrow={props.isNarrow}
        isMicro={props.isMicro}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        allDayDate={props.allDayDate}
        segs={props.segs}
        hiddenSegs={props.hiddenSegs}
        alignElRef={props.alignElRef}
        alignParentTop={props.alignParentTop}
        dateSpanProps={props.dateSpanProps}
        popoverContent={() => (
          <Fragment>
            {props.segs.map((seg) => {
              let { eventRange } = seg
              let { instanceId } = eventRange.instance
              let isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
              let isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
              let isInvisible = isDragging || isResizing

              return (
                <div
                  key={instanceId}
                  style={{
                    visibility: isInvisible ? 'hidden' : undefined,
                  }}
                >
                  <StandardEvent
                    display={hasListItemDisplay(seg) ? 'list-item' : 'row'}
                    eventRange={eventRange}
                    isStart={seg.isStart}
                    isEnd={seg.isEnd}
                    isDragging={isDragging}
                    isResizing={isResizing}
                    isMirror={false}
                    isSelected={instanceId === props.eventSelection}
                    defaultTimeFormat={DEFAULT_TABLE_EVENT_TIME_FORMAT}
                    defaultDisplayEventEnd={false}
                    {...getEventRangeMeta(eventRange, props.todayRange)}
                  />
                </div>
              )
            })}
          </Fragment>
        )}
      />
    )
  }
}
