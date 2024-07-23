import { CssDimValue } from '@fullcalendar/core'
import {
  EventSegUiInteractionState,
  DateComponent,
  DateRange,
  getSegMeta,
  DateProfile,
  BgEvent,
  renderFill,
  isPropsEqual,
  buildEventRangeKey,
  sortEventSegs,
  DayTableCell,
  setRef,
  RefMapKeyed,
  createFormatter,
  WeekNumberContainer,
  buildNavLinkAttrs,
} from '@fullcalendar/core/internal'
import {
  VNode,
  createElement,
  Fragment,
  Ref,
} from '@fullcalendar/core/preact'
import { TableSeg, splitSegsByFirstCol } from '../TableSeg.js'
import { DayCell } from './DayCell.js'
import { DayGridListEvent } from './DayGridListEvent.js'
import { DayGridBlockEvent } from './DayGridBlockEvent.js'
import { generateSegKey, generateSegUid, newComputeFgSegPlacement, NewTableSegPlacement } from '../event-placement.js'
import { hasListItemDisplay } from '../event-rendering.js'

export interface DayGridRowProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cells: DayTableCell[]
  showDayNumbers: boolean
  forPrint: boolean

  // content
  fgEventSegs: TableSeg[]
  bgEventSegs: TableSeg[]
  businessHourSegs: TableSeg[]
  dateSelectionSegs: TableSeg[]
  eventDrag: EventSegUiInteractionState | null
  eventResize: EventSegUiInteractionState | null
  eventSelection: string
  dayMaxEvents: boolean | number
  dayMaxEventRows: boolean | number

  // dimensions
  colWidth?: number
  height?: number

  // refs
  elRef?: Ref<HTMLTableRowElement>
  cellInnerElRefMap?: RefMapKeyed<string, HTMLElement>
}

interface DayGridRowState {
  fgContainerTops: { [key: string]: number }
  fgContainerHeights: { [key: string]: number }
  segHeights: { [segUid: string]: number }
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'narrow' })

export class DayGridRow extends DateComponent<DayGridRowProps, DayGridRowState> {
  private rootEl?: HTMLElement
  private fcContainerElRefMap = new RefMapKeyed<string, HTMLDivElement>()
  private segHarnessElRefMap = new RefMapKeyed<string, HTMLDivElement>() // indexed by generateSegUid

  state: DayGridRowState = {
    fgContainerTops: {},
    fgContainerHeights: {},
    segHeights: {},
  }

  render() {
    let { props, state, context } = this
    let { cells, cellInnerElRefMap } = props
    let { fgContainerTops, fgContainerHeights } = state
    let { options } = context

    let weekDate = props.cells[0].date
    let colCnt = props.cells.length

    let businessHoursByCol = splitSegsByFirstCol(props.businessHourSegs, colCnt)
    let bgEventSegsByCol = splitSegsByFirstCol(props.bgEventSegs, colCnt)
    let highlightSegsByCol = splitSegsByFirstCol(this.getHighlightSegs(), colCnt)
    let mirrorSegsByCol = splitSegsByFirstCol(this.getMirrorSegs(), colCnt)

    let fgLiquid = props.dayMaxEvents === true || props.dayMaxEventRows === true

    let { segPlacementsByCol, moreTops, moreCnts } = newComputeFgSegPlacement(
      sortEventSegs(props.fgEventSegs, options.eventOrder) as TableSeg[],
      props.dayMaxEvents,
      props.dayMaxEventRows,
      options.eventOrderStrict,
      cells.map((cell) => fgContainerTops[cell.key]),
      fgLiquid ? cells.map((cell) => fgContainerHeights[cell.key]) : [],
      state.segHeights,
      props.cells,
    )

    let isForcedInvisible = // TODO: messy way to compute this
      (props.eventDrag && props.eventDrag.affectedInstances) ||
      (props.eventResize && props.eventResize.affectedInstances) ||
      {}

    return (
      <div
        role="row"
        style={{ height: props.height }}
        ref={this.handleRootEl}
      >
        {options.weekNumbers && ( // NOTE: this will mess-up the .children hack the owner uses
          <WeekNumberContainer
            elTag="a"
            elClasses={['fc-daygrid-week-number']}
            elAttrs={buildNavLinkAttrs(context, weekDate, 'week')}
            date={weekDate}
            defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
          />
        )}
        {props.cells.map((cell, col) => {
          let segPlacements = segPlacementsByCol[col]

          let normalFgNodes = this.renderFgSegs(
            segPlacements,
            props.todayRange,
            isForcedInvisible,
          )

          let mirrorFgNodes = this.renderFgSegs(
            buildMirrorPlacements(mirrorSegsByCol[col], segPlacements),
            props.todayRange,
            {},
            Boolean(props.eventDrag),
            Boolean(props.eventResize),
            false, // date-selecting (because mirror is never drawn for date selection)
          )

          return (
            <DayCell
              key={cell.key}
              dateProfile={props.dateProfile}
              todayRange={props.todayRange}
              date={cell.date}
              showDayNumber={props.showDayNumbers}

              // content
              segPlacements={segPlacements}
              fgLiquid={fgLiquid}
              fg={(
                <Fragment>
                  <Fragment>{normalFgNodes}</Fragment>
                  <Fragment>{mirrorFgNodes}</Fragment>
                </Fragment>
              )}
              bg={(
                <Fragment>
                  {this.renderFillSegs(highlightSegsByCol[col], 'highlight')}
                  {this.renderFillSegs(businessHoursByCol[col], 'non-business')}
                  {this.renderFillSegs(bgEventSegsByCol[col], 'bg-event')}
                </Fragment>
              )}
              moreCnt={moreCnts[col]}
              eventDrag={props.eventDrag}
              eventResize={props.eventResize}
              eventSelection={props.eventSelection}

              // render hooks
              extraRenderProps={cell.extraRenderProps}
              extraDateSpan={cell.extraDateSpan}
              extraDataAttrs={cell.extraDataAttrs}
              extraClassNames={cell.extraClassNames}

              // dimensions
              moreTop={moreTops[col]}
              width={props.colWidth}

              // refs
              innerElRef={cellInnerElRefMap && cellInnerElRefMap.createRef(cell.key)}
              fgContainerElRef={this.fcContainerElRefMap.createRef(cell.key)}
            />
          )
        })}
      </div>
    )
  }

  renderFgSegs(
    segPlacements: NewTableSegPlacement[],
    todayRange: DateRange,
    isForcedInvisible: { [instanceId: string]: any },
    isDragging?: boolean,
    isResizing?: boolean,
    isDateSelecting?: boolean,
  ): VNode[] {
    let { props, context } = this
    let { isRtl } = context
    let { colWidth, eventSelection } = props

    let colCnt = props.cells.length
    let defaultDisplayEventEnd = props.cells.length === 1 // colCnt === 1
    let isMirror = isDragging || isResizing || isDateSelecting
    let nodes: VNode[] = []

    for (let placement of segPlacements) {
      let { seg, top } = placement
      let { instanceId } = seg.eventRange.instance
      let isVisible = top != null && !isForcedInvisible[instanceId]
      let width: CssDimValue
      let left: CssDimValue
      let right: CssDimValue

      if (colWidth != null) {
        width = (seg.lastCol - seg.firstCol + 1) * colWidth

        if (isRtl) {
          right = (seg.lastCol - colCnt - 1) * colWidth
        } else {
          left = seg.firstCol * colWidth
        }
      } else {
        const widthFrac = 1 / colCnt
        width = widthFrac * 100 + '%'

        if (isRtl) {
          right = ((seg.lastCol - colCnt - 1) * widthFrac) * 100  + '%'
        } else {
          left = seg.firstCol * widthFrac * 100 + '%'
        }
      }

      /*
      known bug: events that are force to be list-item but span multiple days still take up space in later columns
      todo: in print view, for multi-day events, don't display title within non-start/end segs
      */
      nodes.push(
        <div
          className={'fc-daygrid-event-harness fc-daygrid-event-harness-abs'}
          key={generateSegKey(seg)}
          ref={isMirror ? null : this.segHarnessElRefMap.createRef(generateSegUid(seg))}
          style={{
            visibility: isVisible ? ('' as any) : 'hidden',
            top: top != null ? top : '',
            left,
            right,
            width,
          }}
        >
          {hasListItemDisplay(seg) ? (
            <DayGridListEvent
              seg={seg}
              isDragging={isDragging}
              isSelected={instanceId === eventSelection}
              defaultDisplayEventEnd={defaultDisplayEventEnd}
              {...getSegMeta(seg, todayRange)}
            />
          ) : (
            <DayGridBlockEvent
              seg={seg}
              isDragging={isDragging}
              isResizing={isResizing}
              isDateSelecting={isDateSelecting}
              isSelected={instanceId === eventSelection}
              defaultDisplayEventEnd={defaultDisplayEventEnd}
              {...getSegMeta(seg, todayRange)}
            />
          )}
        </div>,
      )
    }

    return nodes
  }

  renderFillSegs(segs: TableSeg[], fillType: string): VNode {
    let { props, context } = this
    let { isRtl } = context
    let { todayRange, colWidth } = props

    let colCnt = props.cells.length
    let nodes: VNode[] = []

    for (let seg of segs) {
      let width: CssDimValue
      let left: CssDimValue
      let right: CssDimValue

      // TODO: more DRY with fg events
      if (colWidth != null) {
        width = (seg.lastCol - seg.firstCol + 1) * colWidth

        if (isRtl) {
          right = (seg.lastCol - colCnt - 1) * colWidth
        } else {
          left = seg.firstCol * colWidth
        }
      } else {
        const widthFrac = 1 / colCnt
        width = widthFrac * 100 + '%'

        if (isRtl) {
          right = ((seg.lastCol - colCnt - 1) * widthFrac) * 100  + '%'
        } else {
          left = seg.firstCol * widthFrac * 100 + '%'
        }
      }

      nodes.push(
        <div
          key={buildEventRangeKey(seg.eventRange)}
          className="fc-daygrid-bg-harness"
          style={{
            left,
            right,
            width,
          }}
        >
          {fillType === 'bg-event' ?
            <BgEvent seg={seg} {...getSegMeta(seg, todayRange)} /> :
            renderFill(fillType)}
        </div>,
      )
    }

    return createElement(Fragment, {}, ...nodes)
  }

  // Lifecycle
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
  }

  componentDidUpdate() {
    this.handleSizing()
  }

  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)
  }

  // Handlers
  // -----------------------------------------------------------------------------------------------

  handleRootEl = (rootEl: HTMLElement | null) => {
    this.rootEl = rootEl
    setRef(this.props.elRef, rootEl)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  handleSizing = () => {
    const { props } = this
    const { fgContainerTops, fgContainerHeights } = this.queryFgContainerDims()
    const segHeights = this.querySegHeights()
    const fgLiquid = props.dayMaxEvents === true || props.dayMaxEventRows === true

    this.safeSetState({ fgContainerTops, segHeights })

    if (fgLiquid) {
      this.safeSetState({ fgContainerHeights })
    }
  }

  querySegHeights() {
    const { segHarnessElRefMap } = this
    const segHeights: { [segUid: string]: number } = {}

    for (const [segUid, segHarnessEl] of segHarnessElRefMap.current.entries()) {
      segHeights[segUid] = segHarnessEl.getBoundingClientRect().height
    }

    return segHeights
  }

  queryFgContainerDims() {
    const { rootEl, fcContainerElRefMap } = this
    const rootElTop = rootEl.getBoundingClientRect().top
    const fgContainerTops: { [key: string]: number } = {}
    const fgContainerHeights: { [key: string]: number } = {}

    for (const [key, fgContainerEl] of fcContainerElRefMap.current.entries()) {
      const rect = fgContainerEl.getBoundingClientRect()
      fgContainerTops[key] = rect.top - rootElTop
      fgContainerHeights[key] = rect.height
    }

    return { fgContainerTops, fgContainerHeights }
  }

  // Utils
  // -----------------------------------------------------------------------------------------------

  getMirrorSegs(): TableSeg[] {
    let { props } = this

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs as TableSeg[]
    }

    return []
  }

  getHighlightSegs(): TableSeg[] {
    let { props } = this

    if (props.eventDrag && props.eventDrag.segs.length) { // messy check
      return props.eventDrag.segs as TableSeg[]
    }

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs as TableSeg[]
    }

    return props.dateSelectionSegs
  }
}

/*
TODO: make these comparisons fuzzy with coordinates
*/
DayGridRow.addStateEquality({
  fgContainerTops: isPropsEqual,
  fgContainerHeights: isPropsEqual,
  segHeights: isPropsEqual,
})

function buildMirrorPlacements(
  mirrorSegs: TableSeg[],
  segPlacements: NewTableSegPlacement[]
): NewTableSegPlacement[] {
  if (!mirrorSegs.length) {
    return []
  }
  let topsByInstanceId = buildAbsoluteTopHash(segPlacements) // TODO: cache this at first render?

  return mirrorSegs.map((seg: TableSeg) => ({
    seg,
    top: topsByInstanceId[seg.eventRange.instance.instanceId],
    isVisible: true,
  }))
}

function buildAbsoluteTopHash(segPlacements: NewTableSegPlacement[]): { [instanceId: string]: number } {
  let topsByInstanceId: { [instanceId: string]: number } = {}

  for (let segPlacement of segPlacements) {
    topsByInstanceId[segPlacement.seg.eventRange.instance.instanceId] = segPlacement.top
  }

  return topsByInstanceId
}
