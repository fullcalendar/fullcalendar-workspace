import {
  BaseComponent,
  BgEvent,
  buildEventRangeKey,
  DateMarker,
  DateProfile,
  DateRange, DayCellContainer,
  Dictionary,
  EventRangeProps,
  EventSegUiInteractionState,
  fracToCssDim,
  getEventRangeMeta,
  hasCustomDayCellContent,
  joinClassNames,
  memoize,
  renderFill,
  SegGroup,
  sortEventSegs
} from '@fullcalendar/core/internal'
import {
  createElement,
  Fragment,
} from '@fullcalendar/core/preact'
import { TimeGridCoordRange, TimeGridRange } from '../TimeColsSeg.js'
import { computeFgSegVerticals, TimeGridSegVertical } from '../event-placement.js'
import { buildWebPositioning, SegWebRect } from '../seg-web.js'
import { TimeGridEvent } from './TimeGridEvent.js'
import { TimeGridMoreLink } from './TimeGridMoreLink.js'
import { TimeGridNowIndicatorLine } from './TimeGridNowIndicatorLine.js'

// Firefox is terrible at rendering absolute elements that span across multiple print pages
export const simplifiedTimeGridPrint = /* true || */
  navigator.userAgent.toLowerCase().includes('firefox')

export interface TimeGridColProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  date: DateMarker
  slatCnt: number
  attrs?: any
  renderProps?: any
  className?: string
  dateSpanProps?: Dictionary
  forPrint: boolean
  borderStart: boolean

  // content
  fgEventSegs: (TimeGridRange & EventRangeProps)[]
  bgEventSegs: (TimeGridRange & EventRangeProps)[]
  businessHourSegs: (TimeGridRange & EventRangeProps)[]
  nowIndicatorSegs: TimeGridRange[]
  dateSelectionSegs: (TimeGridRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<TimeGridRange> | null
  eventResize: EventSegUiInteractionState<TimeGridRange> | null
  eventSelection: string

  // dimensions
  width: number | undefined
  slatHeight: number | undefined
}

export class TimeGridCol extends BaseComponent<TimeGridColProps> {
  sortEventSegs: typeof sortEventSegs = memoize(sortEventSegs)

  render() {
    let { props, context } = this
    let { options } = context
    let isSelectMirror = options.selectMirror

    let mirrorSegs: (TimeGridRange & EventRangeProps)[] = // yuck
      (props.eventDrag && props.eventDrag.segs) ||
      (props.eventResize && props.eventResize.segs) ||
      (isSelectMirror && props.dateSelectionSegs) ||
      []

    let interactionAffectedInstances = // TODO: messy way to compute this
      (props.eventDrag && props.eventDrag.affectedInstances) ||
      (props.eventResize && props.eventResize.affectedInstances) ||
      {}

    let sortedFgSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder)

    return (
      <DayCellContainer
        tag="div"
        attrs={{
          role: 'gridcell',
          ...props.attrs,
        }}
        className={joinClassNames(
          props.className,
          'fc-timegrid-day fc-flex-col fc-rel',
          props.borderStart && 'fc-border-s',
          props.width == null && 'fc-liquid',
        )}
        style={{
          width: props.width
        }}
        date={props.date}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        renderProps={props.renderProps}
      >
        {(InnerContent) => (
          <Fragment>
            {this.renderFillSegs(props.businessHourSegs, 'non-business')}
            {this.renderFillSegs(props.bgEventSegs, 'bg-event')}
            {this.renderFillSegs(props.dateSelectionSegs, 'highlight')}
            {hasCustomDayCellContent(options) && (
              <InnerContent
                tag="div"
                className='fc-timegrid-day-misc fc-rel'
              />
            )}
            {/* has a z-index to contain all event z-indexes  */}
            <div className={joinClassNames(
              'fc-timegrid-day-events',
              (props.forPrint && simplifiedTimeGridPrint)
                ? 'fc-timegrid-day-events-simple'
                : 'fc-fill',
            )}>
              {this.renderFgSegs(
                sortedFgSegs,
                interactionAffectedInstances,
                false,
                false,
                false,
              )}
            </div>
            {Boolean(mirrorSegs.length) && (
              // has a z-index to be above other fg container,
              // but only show it when there are actual mirror events, to avoid blocking clicks
              <div className='fc-timegrid-day-events fc-fill'>
                {this.renderFgSegs(
                  mirrorSegs,
                  {},
                  Boolean(props.eventDrag),
                  Boolean(props.eventResize),
                  Boolean(isSelectMirror),
                  'mirror',
                )}
              </div>
            )}
            {this.renderNowIndicator(props.nowIndicatorSegs)}
          </Fragment>
        )}
      </DayCellContainer>
    )
  }

  renderFgSegs(
    sortedFgSegs: (TimeGridRange & EventRangeProps)[],
    segIsInvisible: { [instanceId: string]: any },
    isDragging: boolean,
    isResizing: boolean,
    isDateSelecting: boolean,
    forcedKey?: string,
  ) {
    const { props } = this

    if (props.forPrint && simplifiedTimeGridPrint) {
      return renderPlainFgSegs(sortedFgSegs, props)
    }

    return this.renderPositionedFgSegs(
      sortedFgSegs,
      segIsInvisible,
      isDragging,
      isResizing,
      isDateSelecting,
      forcedKey,
    )
  }

  renderPositionedFgSegs(
    segs: (TimeGridRange & EventRangeProps)[], // if not mirror, needs to be sorted
    segIsInvisible: { [instanceId: string]: any },
    isDragging: boolean,
    isResizing: boolean,
    isDateSelecting: boolean,
    forcedKey?: string,
  ) {
    let { props, context } = this
    let { date, dateProfile, eventSelection, todayRange, nowDate } = props
    let { eventMaxStack, eventShortHeight, eventOrderStrict, eventMinHeight } = context.options

    // TODO: memoize this?
    let segVerticals = computeFgSegVerticals(
      segs,
      dateProfile,
      date,
      props.slatCnt,
      props.slatHeight,
      eventMinHeight,
      eventShortHeight,
    )
    let [segRects, hiddenGroups] = buildWebPositioning(segs, segVerticals, eventOrderStrict, eventMaxStack)
    let isMirror = isDragging || isResizing || isDateSelecting

    return (
      <Fragment>
        {segs.map((seg, index) => {
          let { eventRange } = seg
          let instanceId = eventRange.instance.instanceId // guaranteed because it's an fg event
          let segVertical: Partial<TimeGridSegVertical> = segVerticals[index] || {}
          let segRect = segRects.get(instanceId) // for horizontals. could be undefined!? HACK

          let hStyle = (!isMirror && segRect)
            ? this.computeSegHStyle(segRect)
            : { left: 0, right: 0 }

          let isVisible = isMirror || (segRect && !segIsInvisible[instanceId])
          let isInset = segRect && Boolean(segRect.stackDepth)

          return (
            <div
              // we would have used fc-fill, but multi-page spanning breaks in Firefox
              // we would have used height:100%, but multi-page spanning breaks in Safari
              className='fc-abs fc-flex-col'
              key={forcedKey || instanceId}
              style={{
                visibility: isVisible ? ('' as any) : 'hidden',
                top: segVertical.start,
                height: segVertical.size,
                ...hStyle,
              }}
            >
              <TimeGridEvent
                eventRange={eventRange}
                slicedStart={seg.startDate}
                slicedEnd={seg.endDate}
                isStart={seg.isStart}
                isEnd={seg.isEnd}
                isDragging={isDragging}
                isResizing={isResizing}
                isDateSelecting={isDateSelecting}
                isSelected={instanceId === eventSelection}
                isShort={segVertical.isShort || false}
                isInset={isInset}
                isLiquid
                {...getEventRangeMeta(eventRange, todayRange, nowDate)}
              />
            </div>
          )
        })}
        {this.renderHiddenGroups(hiddenGroups)}
      </Fragment>
    )
  }

  /*
  NOTE: will already have eventMinHeight applied because segEntries(?) already had it
  */
  renderHiddenGroups(hiddenGroups: SegGroup<TimeGridCoordRange>[]) {
    let { dateSpanProps, dateProfile, todayRange, nowDate, eventSelection, eventDrag, eventResize } = this.props

    return (
      <Fragment>
        {hiddenGroups.map((hiddenGroup) => {
          return (
            <TimeGridMoreLink
              key={hiddenGroup.key}
              hiddenSegs={hiddenGroup.segs}
              top={hiddenGroup.start}
              height={hiddenGroup.end - hiddenGroup.start}
              dateSpanProps={dateSpanProps}
              dateProfile={dateProfile}
              todayRange={todayRange}
              nowDate={nowDate}
              eventSelection={eventSelection}
              eventDrag={eventDrag}
              eventResize={eventResize}
            />
          )
        })}
      </Fragment>
    )
  }

  renderFillSegs(segs: (TimeGridRange & EventRangeProps)[], fillType: string) {
    let { props, context } = this
    let segVerticals = computeFgSegVerticals(
      segs,
      props.dateProfile,
      props.date,
      props.slatCnt,
      props.slatHeight,
      context.options.eventMinHeight,
    )

    return (
      <Fragment>
        {segs.map((seg, index) => {
          const { eventRange } = seg
          const segVertical: Partial<TimeGridSegVertical> = segVerticals[index] || {}

          return (
            <div
              key={buildEventRangeKey(eventRange)}
              className="fc-fill-x"
              style={{
                top: segVertical.start,
                height: segVertical.size,
              }}
            >
              {fillType === 'bg-event' ?
                <BgEvent
                  eventRange={eventRange}
                  isStart={seg.isStart}
                  isEnd={seg.isEnd}
                  {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate)}
                /> :
                renderFill(fillType)}
            </div>
          )
        })}
      </Fragment>
    )
  }

  renderNowIndicator(segs: TimeGridRange[]) {
    let { date, dateProfile, slatHeight, slatCnt } = this.props

    // TODO: what if nowIndicator turned OFF??

    return segs.map((seg) => (
      <TimeGridNowIndicatorLine
        nowDate={seg.startDate}
        dayDate={date}
        dateProfile={dateProfile}
        totalHeight={slatHeight != null ? slatHeight * slatCnt : undefined}
      />
    ))
  }

  /*
  TODO: eventually move to width, not left+right
  */
  computeSegHStyle(segRect: SegWebRect) {
    let { isRtl, options } = this.context
    let shouldOverlap = options.slotEventOverlap
    let nearCoord = segRect.levelCoord // the left side if LTR. the right side if RTL. floating-point
    let farCoord = segRect.levelCoord + segRect.thickness // the right side if LTR. the left side if RTL. floating-point
    let left // amount of space from left edge, a fraction of the total width
    let right // amount of space from right edge, a fraction of the total width

    if (shouldOverlap) {
      // double the width, but don't go beyond the maximum forward coordinate (1.0)
      farCoord = Math.min(1, nearCoord + (farCoord - nearCoord) * 2)
    }

    if (isRtl) {
      left = 1 - farCoord
      right = nearCoord
    } else {
      left = nearCoord
      right = 1 - farCoord
    }

    let props = {
      zIndex: segRect.stackDepth + 1, // convert from 0-base to 1-based
      left: fracToCssDim(left),
      right: fracToCssDim(right),
    }

    if (shouldOverlap && segRect.stackForward) {
      // add padding to the edge so that forward stacked events don't cover the resizer's icon
      props[isRtl ? 'marginLeft' : 'marginRight'] = 10 * 2 // 10 is a guesstimate of the icon's width
    }

    return props
  }
}

export function renderPlainFgSegs(
  sortedFgSegs: (TimeGridRange & EventRangeProps)[],
  { todayRange, nowDate, eventSelection, eventDrag, eventResize }: {
    todayRange: DateRange
    nowDate: DateMarker
    eventSelection: string
    eventDrag: EventSegUiInteractionState<TimeGridRange> | null
    eventResize: EventSegUiInteractionState<TimeGridRange> | null
  },
) {
  let hiddenInstances =
    (eventDrag ? eventDrag.affectedInstances : null) ||
    (eventResize ? eventResize.affectedInstances : null) ||
    {}

  return (
    <Fragment>
      {sortedFgSegs.map((seg) => {
        let { eventRange } = seg
        let { instanceId } = eventRange.instance

        return (
          <div
            key={instanceId}
            style={{ visibility: hiddenInstances[instanceId] ? 'hidden' : ('' as any) }}
          >
            <TimeGridEvent
              eventRange={eventRange}
              slicedStart={seg.startDate}
              slicedEnd={seg.endDate}
              isStart={seg.isStart}
              isEnd={seg.isEnd}
              isDragging={false}
              isResizing={false}
              isDateSelecting={false}
              isSelected={instanceId === eventSelection}
              isShort={false}
              isInset={false}
              {...getEventRangeMeta(eventRange, todayRange, nowDate)}
            />
          </div>
        )
      })}
    </Fragment>
  )
}
