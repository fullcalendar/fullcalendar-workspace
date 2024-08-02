import { CssDimValue } from '@fullcalendar/core'
import {
  DateMarker, BaseComponent, EventSegUiInteractionState, Seg, getSegMeta,
  DateRange, DayCellContainer, BgEvent, renderFill, buildIsoString, computeEarliestSegStart,
  DateProfile, buildEventRangeKey, sortEventSegs, memoize, SegEntryGroup, SegEntry, Dictionary, SegSpan, hasCustomDayCellContent,
} from '@fullcalendar/core/internal'
import {
  createElement,
  Fragment,
  Ref,
} from '@fullcalendar/core/preact'
import { TimeGridMoreLink } from './TimeGridMoreLink.js'
import { TimeColsSeg } from '../TimeColsSeg.js'
import { SegWebRect } from '../seg-web.js'
import { computeFgSegPlacements, newComputeSegVCoords } from '../event-placement.js'
import { TimeGridEvent } from './TimeGridEvent.js'
import { TimeGridNowIndicatorLine } from './TimeGridNowIndicatorLine.js'

export interface TimeGridColProps {
  dateProfile: DateProfile
  nowDate: DateMarker
  todayRange: DateRange
  date: DateMarker
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

  // refs
  elRef?: Ref<HTMLTableCellElement>

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

    return (
      <DayCellContainer
        elTag="div"
        elRef={props.elRef}
        elClasses={[
          'fcnew-cell',
          'fcnew-timegrid-col',
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
          <Fragment>
            <div className="fcnew-timegrid-col-bg">
              {this.renderFillSegs(props.businessHourSegs, 'non-business')}
              {this.renderFillSegs(props.bgEventSegs, 'bg-event')}
              {this.renderFillSegs(props.dateSelectionSegs, 'highlight')}
            </div>
            <div className="fcnew-timegrid-col-events">
              {this.renderFgSegs(
                sortedFgSegs,
                interactionAffectedInstances,
                false,
                false,
                false,
              )}
            </div>
            <div className="fcnew-timegrid-col-events">
              {this.renderFgSegs(
                mirrorSegs as TimeColsSeg[],
                {},
                Boolean(props.eventDrag),
                Boolean(props.eventResize),
                Boolean(isSelectMirror),
                'mirror',
              )}
            </div>
            <div className="fcnew-timegrid-now-indicator-container">
              {this.renderNowIndicator(props.nowIndicatorSegs)}
            </div>
            {hasCustomDayCellContent(options) && (
              <InnerContent
                elTag="div"
                elClasses={['fcnew-timegrid-col-misc']}
              />
            )}
          </Fragment>
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
    segs: TimeColsSeg[], // if not mirror, needs to be sorted
    segIsInvisible: { [instanceId: string]: any },
    isDragging: boolean,
    isResizing: boolean,
    isDateSelecting: boolean,
    forcedKey?: string,
  ) {
    let { props } = this

    let { eventMaxStack, eventShortHeight, eventOrderStrict, eventMinHeight } = this.context.options
    let { date, eventSelection, todayRange, nowDate } = this.props
    let isMirror = isDragging || isResizing || isDateSelecting

    // TODO: memoize this???
    let segVCoords = newComputeSegVCoords(segs, date, props.slatHeight, eventMinHeight)
    let { segPlacements, hiddenGroups } = computeFgSegPlacements(segs, segVCoords, eventOrderStrict, eventMaxStack)

    return (
      <Fragment>
        {this.renderHiddenGroups(hiddenGroups, segs)}
        {segPlacements.map((segPlacement) => {
          let { seg, rect } = segPlacement
          let instanceId = seg.eventRange.instance.instanceId
          let isVisible = isMirror || Boolean(!segIsInvisible[instanceId] && rect)
          let vStyle = computeSegVStyle(rect && rect.span)
          let hStyle = (!isMirror && rect) ? this.computeSegHStyle(rect) : { left: 0, right: 0 }
          let isInset = Boolean(rect) && rect.stackForward > 0
          let isShort = Boolean(rect) && (rect.span.end - rect.span.start) < eventShortHeight // look at other places for this problem

          return (
            <div
              className={
                'fcnew-timegrid-event-harness' +
                (isInset ? ' fcnew-timegrid-event-harness-inset' : '')
              }
              key={forcedKey || instanceId}
              style={{
                visibility: isVisible ? ('' as any) : 'hidden',
                ...vStyle,
                ...hStyle,
              }}
            >
              <TimeGridEvent
                seg={seg}
                isDragging={isDragging}
                isResizing={isResizing}
                isDateSelecting={isDateSelecting}
                isSelected={instanceId === eventSelection}
                isShort={isShort}
                {...getSegMeta(seg, todayRange, nowDate)}
              />
            </div>
          )
        })}
      </Fragment>
    )
  }

  // will already have eventMinHeight applied because segInputs already had it
  renderHiddenGroups(hiddenGroups: SegEntryGroup[], segs: TimeColsSeg[]) {
    let { extraDateSpan, dateProfile, todayRange, nowDate, eventSelection, eventDrag, eventResize } = this.props
    return (
      <Fragment>
        {hiddenGroups.map((hiddenGroup) => {
          let positionCss = computeSegVStyle(hiddenGroup.span)
          let hiddenSegs = compileSegsFromEntries(hiddenGroup.entries, segs)
          return (
            <TimeGridMoreLink
              key={buildIsoString(computeEarliestSegStart(hiddenSegs))}
              hiddenSegs={hiddenSegs}
              top={positionCss.top}
              bottom={positionCss.bottom}
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
    let segVCoords = newComputeSegVCoords(segs, props.date, props.slatHeight, context.options.eventMinHeight) // don't assume all populated

    let children = segVCoords.map((vcoords, i) => {
      let seg = segs[i]
      return (
        <div
          key={buildEventRangeKey(seg.eventRange)}
          className="fcnew-timegrid-bg-harness"
          style={computeSegVStyle(vcoords)}
        >
          {fillType === 'bg-event' ?
            <BgEvent seg={seg} {...getSegMeta(seg, props.todayRange, props.nowDate)} /> :
            renderFill(fillType)}
        </div>
      )
    })

    return <Fragment>{children}</Fragment>
  }

  renderNowIndicator(segs: TimeColsSeg[]) {
    let { slatHeight, date } = this.props

    if (!slatHeight) { return null }

    return segs.map((_seg) => (
      <TimeGridNowIndicatorLine
        nowDate={date}
        // top: computeDateTopFromSlatHeight(seg.start, date, slatHeight),
      />
    ))
  }

  computeSegHStyle(segHCoords: SegWebRect) {
    let { isRtl, options } = this.context
    let shouldOverlap = options.slotEventOverlap
    let nearCoord = segHCoords.levelCoord // the left side if LTR. the right side if RTL. floating-point
    let farCoord = segHCoords.levelCoord + segHCoords.thickness // the right side if LTR. the left side if RTL. floating-point
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
      zIndex: segHCoords.stackDepth + 1, // convert from 0-base to 1-based
      left: left * 100 + '%',
      right: right * 100 + '%',
    }

    if (shouldOverlap && !segHCoords.stackForward) {
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
            style={{ visibility: hiddenInstances[instanceId] ? 'hidden' : ('' as any) }}
          >
            <TimeGridEvent
              seg={seg}
              isDragging={false}
              isResizing={false}
              isDateSelecting={false}
              isSelected={instanceId === eventSelection}
              isShort={false}
              {...getSegMeta(seg, todayRange, nowDate)}
            />
          </div>
        )
      })}
    </Fragment>
  )
}

function computeSegVStyle(segVCoords: SegSpan | null): { top: CssDimValue, bottom: CssDimValue } {
  if (!segVCoords) {
    return { top: '', bottom: '' }
  }
  return {
    top: segVCoords.start,
    bottom: -segVCoords.end,
  }
}

function compileSegsFromEntries(
  segEntries: SegEntry[],
  allSegs: TimeColsSeg[],
): TimeColsSeg[] {
  return segEntries.map((segEntry) => allSegs[segEntry.index])
}

// function computeDateTopFromSlatHeight(date: DateMarker, startOfDay: DateMarker, slatHeight: number): number {
//   return null as any // !!!!
// }
