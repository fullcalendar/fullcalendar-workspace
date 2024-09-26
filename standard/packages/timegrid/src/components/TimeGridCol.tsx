import {
  BaseComponent,
  BgEvent,
  buildEventRangeKey,
  DateMarker,
  DateProfile,
  DateRange, DayCellContainer,
  Dictionary,
  EventSegUiInteractionState,
  fracToCssDim,
  getSegMeta,
  hasCustomDayCellContent,
  memoize,
  renderFill,
  Seg,
  SegGroup,
  sortEventSegs
} from '@fullcalendar/core/internal'
import {
  createElement,
  Fragment,
} from '@fullcalendar/core/preact'
import { TimeColsSeg } from '../TimeColsSeg.js'
import { computeFgSegHorizontals, computeFgSegVerticals } from '../event-placement.js'
import { SegWebRect } from '../seg-web.js'
import { TimeGridEvent } from './TimeGridEvent.js'
import { TimeGridMoreLink } from './TimeGridMoreLink.js'
import { TimeGridNowIndicatorLine } from './TimeGridNowIndicatorLine.js'

export interface TimeGridColProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  date: DateMarker
  slatCnt: number
  extraDataAttrs?: any
  extraRenderProps?: any
  extraClassNames?: string[]
  extraDateSpan?: Dictionary
  forPrint: boolean

  // content
  fgEventSegs: TimeColsSeg[]
  bgEventSegs: TimeColsSeg[]
  businessHourSegs: TimeColsSeg[]
  nowIndicatorSegs: TimeColsSeg[]
  dateSelectionSegs: TimeColsSeg[]
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  eventSelection: string

  // dimensions
  width: number | undefined
  slatHeight: number | undefined
}

export class TimeGridCol extends BaseComponent<TimeGridColProps> {
  sortEventSegs = memoize(sortEventSegs)

  render() {
    let { props, context } = this
    let { options } = context
    let isSelectMirror = options.selectMirror

    let mirrorSegs: Seg[] = // yuck
      (props.eventDrag && props.eventDrag.segs) ||
      (props.eventResize && props.eventResize.segs) ||
      (isSelectMirror && props.dateSelectionSegs) ||
      []

    let interactionAffectedInstances = // TODO: messy way to compute this
      (props.eventDrag && props.eventDrag.affectedInstances) ||
      (props.eventResize && props.eventResize.affectedInstances) ||
      {}

    let sortedFgSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder) as TimeColsSeg[]

    // HACK: equired for when column is taller than slats. because all positioning of events is
    // done via percentages. needs to be a percentage of the total slat height
    let slatsTotalHeight = props.slatHeight != null ? props.slatHeight * props.slatCnt : undefined

    return (
      <DayCellContainer
        elTag="div"
        elClasses={[
          'fc-flex-column',
          'fc-cell',
          props.width != null ? '' : 'fc-liquid',
          'fc-timegrid-col',
          ...(props.extraClassNames || []),
        ]}
        elAttrs={{
          role: 'gridcell',
          ...props.extraDataAttrs,
        }}
        elStyle={{
          width: props.width
        }}
        date={props.date}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        extraRenderProps={props.extraRenderProps}
      >
        {(InnerContent) => (
          <div className='fc-rel fc-flex-column' style={{ height: slatsTotalHeight }}>
            {this.renderFillSegs(props.businessHourSegs, 'non-business')}
            {this.renderFillSegs(props.bgEventSegs, 'bg-event')}
            {this.renderFillSegs(props.dateSelectionSegs, 'highlight')}
            <div className='fc-liquid fc-rel fc-timegrid-col-fg'>
              {this.renderFgSegs(
                sortedFgSegs,
                interactionAffectedInstances,
                false,
                false,
                false,
              )}
              {this.renderFgSegs(
                mirrorSegs as TimeColsSeg[],
                {},
                Boolean(props.eventDrag),
                Boolean(props.eventResize),
                Boolean(isSelectMirror),
                'mirror',
              )}
            </div>
            {this.renderNowIndicator(props.nowIndicatorSegs)}
            {hasCustomDayCellContent(options) && (
              <InnerContent
                elTag="div"
                elClasses={['fc-timegrid-col-misc']}
              />
            )}
          </div>
        )}
      </DayCellContainer>
    )
  }

  renderFgSegs(
    sortedFgSegs: TimeColsSeg[],
    segIsInvisible: { [instanceId: string]: any },
    isDragging: boolean,
    isResizing: boolean,
    isDateSelecting: boolean,
    forcedKey?: string,
  ) {
    let { props } = this
    if (props.forPrint) {
      return renderPlainFgSegs(sortedFgSegs, props) // TODO: test
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
    segs: TimeColsSeg[], // if not mirror, needs to be sorted
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
    let [segRects, hiddenGroups] = computeFgSegHorizontals(segs, segVerticals, eventOrderStrict, eventMaxStack)
    let isMirror = isDragging || isResizing || isDateSelecting

    return (
      <Fragment>
        {this.renderHiddenGroups(hiddenGroups, segs)}
        {segs.map((seg, index) => {
          let instanceId = seg.eventRange.instance.instanceId // guaranteed because it's an fg event
          let segVertical = segVerticals[index]
          let setRect = segRects[index] // for horizontals. could be undefined!? HACK

          let hStyle = (!isMirror && setRect)
            ? this.computeSegHStyle(setRect)
            : { left: 0, right: 0 }

          let isVisible = isMirror || (setRect && !segIsInvisible[instanceId])
          let isInset = setRect && setRect.stackForward > 0

          return (
            <div
              className='fc-abs'
              key={forcedKey || instanceId}
              style={{
                visibility: isVisible ? ('' as any) : 'hidden',
                top: fracToCssDim(segVertical.start),
                height: fracToCssDim(segVertical.size),
                ...hStyle,
              }}
            >
              <TimeGridEvent
                seg={seg}
                isDragging={isDragging}
                isResizing={isResizing}
                isDateSelecting={isDateSelecting}
                isSelected={instanceId === eventSelection}
                isShort={segVertical.isShort}
                isInset={isInset}
                {...getSegMeta(seg, todayRange, nowDate)}
              />
            </div>
          )
        })}
      </Fragment>
    )
  }

  /*
  NOTE: will already have eventMinHeight applied because segEntries already had it
  */
  renderHiddenGroups(hiddenGroups: SegGroup[], segs: TimeColsSeg[]) {
    let { extraDateSpan, dateProfile, todayRange, nowDate, eventSelection, eventDrag, eventResize } = this.props

    return (
      <Fragment>
        {hiddenGroups.map((hiddenGroup) => {
          let startFrac = hiddenGroup.span.start
          let endFrac = hiddenGroup.span.end
          let heightFrac = endFrac - startFrac

          return (
            <TimeGridMoreLink
              key={hiddenGroup.key}
              hiddenSegs={hiddenGroup.segs as TimeColsSeg[] /* TODO: make SegGroup generic */}
              top={fracToCssDim(startFrac)}
              height={fracToCssDim(heightFrac)}
              extraDateSpan={extraDateSpan}
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

  renderFillSegs(segs: TimeColsSeg[], fillType: string) {
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
          const segVertical = segVerticals[index]

          return (
            <div
              key={buildEventRangeKey(seg.eventRange)}
              className="fc-timegrid-bg-harness fc-fill-x"
              style={{
                top: fracToCssDim(segVertical.start),
                height: fracToCssDim(segVertical.size),
              }}
            >
              {fillType === 'bg-event' ?
                <BgEvent seg={seg} {...getSegMeta(seg, props.todayRange, props.nowDate)} /> :
                renderFill(fillType)}
            </div>
          )
        })}
      </Fragment>
    )
  }

  renderNowIndicator(segs: TimeColsSeg[]) {
    let { date, dateProfile } = this.props

    // TODO: what if nowIndicator turned OFF??

    return segs.map((seg) => (
      <TimeGridNowIndicatorLine
        nowDate={seg.start}
        dayDate={date}
        dateProfile={dateProfile}
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

    if (shouldOverlap && !segRect.stackForward) {
      // add padding to the edge so that forward stacked events don't cover the resizer's icon
      props[isRtl ? 'marginLeft' : 'marginRight'] = 10 * 2 // 10 is a guesstimate of the icon's width
    }

    return props
  }
}

export function renderPlainFgSegs(
  sortedFgSegs: TimeColsSeg[],
  { todayRange, nowDate, eventSelection, eventDrag, eventResize }: {
    todayRange: DateRange
    nowDate: DateMarker
    eventSelection: string
    eventDrag: EventSegUiInteractionState | null
    eventResize: EventSegUiInteractionState | null
  },
) {
  let hiddenInstances =
    (eventDrag ? eventDrag.affectedInstances : null) ||
    (eventResize ? eventResize.affectedInstances : null) ||
    {}
  return (
    <Fragment>
      {sortedFgSegs.map((seg) => {
        let instanceId = seg.eventRange.instance.instanceId
        return (
          <div
            key={instanceId}
            className='fc-timegrid-harness-plain'
            style={{ visibility: hiddenInstances[instanceId] ? 'hidden' : ('' as any) }}
          >
            <TimeGridEvent
              seg={seg}
              isDragging={false}
              isResizing={false}
              isDateSelecting={false}
              isSelected={instanceId === eventSelection}
              isShort={false}
              isInset={false}
              {...getSegMeta(seg, todayRange, nowDate)}
            />
          </div>
        )
      })}
    </Fragment>
  )
}
