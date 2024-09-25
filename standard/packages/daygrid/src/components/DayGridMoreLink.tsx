import {
  MoreLinkContainer,
  BaseComponent,
  DateMarker,
  Dictionary,
  DateProfile,
  DateRange,
  EventSegUiInteractionState,
  getSegMeta,
} from '@fullcalendar/core/internal'
import { createElement, RefObject, Fragment } from '@fullcalendar/core/preact'
import { hasListItemDisplay } from '../event-rendering.js'
import { DayGridBlockEvent } from './DayGridBlockEvent.js'
import { DayGridListEvent } from './DayGridListEvent.js'
import { TableSeg } from '../TableSeg.js'

export interface DayGridMoreLinkProps {
  allDayDate: DateMarker
  segs: TableSeg[]
  hiddenSegs: TableSeg[]
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
  render() {
    let { props } = this
    return (
      <MoreLinkContainer
        elClasses={['fcnew-daygrid-more-link']}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        allDayDate={props.allDayDate}
        segs={props.segs}
        hiddenSegs={props.hiddenSegs}
        alignmentElRef={props.alignmentElRef}
        alignGridTop={props.alignGridTop}
        extraDateSpan={props.extraDateSpan}
        popoverContent={() => {
          let forcedInvisibleMap = // TODO: more convenient/DRY
            (props.eventDrag ? props.eventDrag.affectedInstances : null) ||
            (props.eventResize ? props.eventResize.affectedInstances : null) ||
            {}

          return (
            <Fragment>
              {props.segs.map((seg) => {
                let instanceId = seg.eventRange.instance.instanceId
                return (
                  <div
                    key={instanceId}
                    style={{
                      visibility: forcedInvisibleMap[instanceId] ? 'hidden' : '',
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
