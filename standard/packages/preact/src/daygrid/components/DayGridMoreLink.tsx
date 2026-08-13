import { MoreLinkContainer } from '../../common/MoreLinkContainer'
import { BaseComponent, setRef } from '../../vdom-util'
import { watchHeight } from '../../component-util/resize-observer'
import { DateMarker, DateRange } from '@full-ui/headless-calendar'
import { Dictionary } from '../../options'
import { DateProfile } from '../../DateProfileGenerator'
import { EventSegUiInteractionState } from '../../component/DateComponent'
import { getEventRangeMeta } from '../../component-util/event-rendering'
import { SlicedCoordRange } from '../../coord-range'
import { StandardEvent } from '../../common/StandardEvent'
import { type Ref, type RefObject, createRef } from 'react'
import { DEFAULT_TABLE_EVENT_TIME_FORMAT, hasListItemDisplay } from '../event-rendering'
import { DayRowEventRange, DayRowEventRangePart } from '../TableSeg'
import classNames from '../../styles.module.css'

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

  // refs
  heightRef?: Ref<number> // occupied height of the link, zero when there is none
}

export class DayGridMoreLink extends BaseComponent<DayGridMoreLinkProps> {
  // ref
  private boxElRef = createRef<HTMLDivElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectHeight?: () => void

  render() {
    let { props } = this

    return (
      /*
      A flex parent, so the link's own trailing margin lands inside the
      measured box instead of collapsing out of it. The link would otherwise
      report one pixel less than it occupies, and placement is not allowed to
      make that up with an assumed gap.
      */
      <div className={classNames.flexCol} ref={this.boxElRef}>
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
            <>
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
            </>
          )}
        />
      </div>
    )
  }

  /*
  The box exists whether or not there is a link to show, so its height is zero
  exactly while this cell owes none. The owner that consumes these only ratchets
  upward and ignores that zero, which is what keeps a link that disappears from
  retracting the shared reservation.
  */
  componentDidMount(): void {
    this._isUnmounting = false

    this.disconnectHeight = watchHeight(this.boxElRef.current, (height) => {
      if (this._isUnmounting) return
      setRef(this.props.heightRef, height)
    })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectHeight()
    setRef(this.props.heightRef, null)
  }
}
