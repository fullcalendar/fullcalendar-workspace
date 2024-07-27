import {
  EventSegUiInteractionState,
  BaseComponent,
  DateRange,
  getSegMeta,
  DateProfile,
  BgEvent,
  renderFill,
  buildEventRangeKey,
  sortEventSegs,
  DayTableCell,
  setRef,
  RefMap,
  createFormatter,
  WeekNumberContainer,
  buildNavLinkAttrs,
  setStateDimMap,
} from '@fullcalendar/core/internal'
import {
  VNode,
  createElement,
  Fragment,
  Ref,
} from '@fullcalendar/core/preact'
import { splitSegsByCol, TableSeg } from '../TableSeg.js'
import { DayGridCell } from './DayGridCell.js'
import { DayGridListEvent } from './DayGridListEvent.js'
import { DayGridBlockEvent } from './DayGridBlockEvent.js'
import { computeFgSegVerticals, getSegSpanId, getSegStartId } from '../event-placement.js'
import { hasListItemDisplay } from '../event-rendering.js'
import { computeHorizontalsFromSeg } from './util.js'

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
  cellInnerElRefMap?: RefMap<string, HTMLElement>
}

interface DayGridRowState {
  fgContainerTops: { [cellKey: string]: number }
  fgContainerHeights: { [cellKey: string]: number }
  segHeights: { [segSpanId: string]: number }
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'narrow' })

export class DayGridRow extends BaseComponent<DayGridRowProps, DayGridRowState> {
  // ref
  private rootEl?: HTMLElement

  // internal
  private fcContainerElRefMap = new RefMap<string, HTMLDivElement>() // indexed by cellKey
  private segHarnessElRefMap = new RefMap<string, HTMLDivElement>() // indexed by segSpanId

  state: DayGridRowState = {
    fgContainerTops: {},
    fgContainerHeights: {},
    segHeights: {},
  }

  render() {
    const { props, state, context } = this
    const { cells, cellInnerElRefMap } = props
    const { fgContainerTops, fgContainerHeights } = state
    const { options } = context

    const weekDate = props.cells[0].date
    const colCnt = props.cells.length
    const fgHeightFixed = props.dayMaxEvents === true || props.dayMaxEventRows === true

    // TODO: memoize? sort all types of segs?
    const fgEventSegs = sortEventSegs(props.fgEventSegs, options.eventOrder) as TableSeg[]

    // TODO: memoize?
    const fgEventSegsByCol = splitSegsByCol(fgEventSegs, colCnt)
    const bgEventSegsByCol = splitSegsByCol(props.bgEventSegs, colCnt)
    const businessHoursByCol = splitSegsByCol(props.businessHourSegs, colCnt)
    const highlightSegsByCol = splitSegsByCol(this.getHighlightSegs(), colCnt)
    const mirrorSegsByCol = splitSegsByCol(this.getMirrorSegs(), colCnt)

    // TODO: memoize?
    const [hiddenSegsByCol, segTops, heightsByCol] = computeFgSegVerticals(
      fgEventSegs,
      state.segHeights,
      cells,
      cells.map((cell) => fgContainerTops[cell.key]),
      fgHeightFixed ? cells.map((cell) => fgContainerHeights[cell.key]) : [],
      options.eventOrderStrict,
      props.dayMaxEvents,
      props.dayMaxEventRows,
    )

    const forcedInvisibleMap = // TODO: more convenient/DRY
      (props.eventDrag && props.eventDrag.affectedInstances) ||
      (props.eventResize && props.eventResize.affectedInstances) ||
      {}

    return (
      <div
        role="row"
        className={[
          'fcnew-daygrid-row',
          fgHeightFixed ? 'fcnew-daygrid-row-fixedheight' : '',
        ].join(' ')}
        style={{ height: props.height }}
        ref={this.handleRootEl}
      >
        {options.weekNumbers && (
          <WeekNumberContainer
            elTag="a"
            elClasses={['fcnew-daygrid-week-number']}
            elAttrs={buildNavLinkAttrs(context, weekDate, 'week')}
            date={weekDate}
            defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
          />
        )}
        {props.cells.map((cell, col) => {
          const normalFgNodes = this.renderFgSegs(
            fgEventSegsByCol[col],
            segTops,
            props.todayRange,
            forcedInvisibleMap,
          )

          const mirrorFgNodes = this.renderFgSegs(
            mirrorSegsByCol[col],
            segTops,
            props.todayRange,
            {}, // forcedInvisibleMap
            Boolean(props.eventDrag),
            Boolean(props.eventResize),
            false, // date-selecting (because mirror is never drawn for date selection)
          )

          return (
            <DayGridCell
              key={cell.key}
              dateProfile={props.dateProfile}
              todayRange={props.todayRange}
              date={cell.date}
              showDayNumber={props.showDayNumbers}

              // content
              segs={fgEventSegsByCol[col]}
              hiddenSegs={hiddenSegsByCol[col]}
              fgHeightFixed={fgHeightFixed}
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
              eventDrag={props.eventDrag}
              eventResize={props.eventResize}
              eventSelection={props.eventSelection}

              // render hooks
              extraRenderProps={cell.extraRenderProps}
              extraDateSpan={cell.extraDateSpan}
              extraDataAttrs={cell.extraDataAttrs}
              extraClassNames={cell.extraClassNames}

              // dimensions
              moreTop={heightsByCol[col]}
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
    segs: TableSeg[],
    segTops: { [segStartId: string]: number },
    todayRange: DateRange,
    forcedInvisibleMap: { [instanceId: string]: any },
    isDragging?: boolean,
    isResizing?: boolean,
    isDateSelecting?: boolean,
  ): VNode[] {
    const { props, context } = this
    const { isRtl } = context
    const { colWidth, eventSelection } = props

    const colCnt = props.cells.length
    const defaultDisplayEventEnd = props.cells.length === 1
    const isMirror = isDragging || isResizing || isDateSelecting
    const nodes: VNode[] = []

    for (const seg of segs) {
      const { left, right, width } = computeHorizontalsFromSeg(seg, colWidth, colCnt, isRtl)

      // TODO: optimize ID creation? all related
      const { instanceId } = seg.eventRange.instance
      const segSpanId = getSegSpanId(seg)
      const segStartId = getSegStartId(seg)

      const top = segTops[segStartId]
      const isVisible =
        !seg.isStandin &&
        top != null &&
        !forcedInvisibleMap[instanceId]

      /*
      TODO: is this comment still relevant? vvvvvvvv
      known bug: events that are force to be list-item but span multiple days still take up space in later columns
      todo: in print view, for multi-day events, don't display title within non-start/end segs
      */
      nodes.push(
        <div
          key={segSpanId}
          className="fcnew-daygrid-event-harness fcnew-daygrid-event-harness-abs"
          style={{
            visibility: isVisible ? '' : 'hidden',
            top,
            left,
            right,
            width,
          }}
          ref={
            (isMirror || seg.isStandin)
              ? null
              : this.segHarnessElRefMap.createRef(segSpanId)
          }
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
    const { props, context } = this
    const { isRtl } = context
    const { todayRange, colWidth } = props

    const colCnt = props.cells.length
    const nodes: VNode[] = []

    for (const seg of segs) {
      const { left, right, width } = computeHorizontalsFromSeg(seg, colWidth, colCnt, isRtl)

      nodes.push(
        <div
          key={buildEventRangeKey(seg.eventRange)}
          className="fcnew-daygrid-bg-harness"
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
    const fgHeightFixed = props.dayMaxEvents === true || props.dayMaxEventRows === true
    const { fgContainerTops, fgContainerHeights } = this.queryFgContainerDims()
    const segHeights = this.querySegHeights()

    setStateDimMap(this, 'fgContainerTops', fgContainerTops)
    setStateDimMap(this, 'segHeights', segHeights)

    if (fgHeightFixed) {
      setStateDimMap(this, 'fgContainerHeights', fgContainerHeights)
    }
  }

  querySegHeights() {
    const { segHarnessElRefMap } = this
    const segHeights: { [segSpanId: string]: number } = {}

    for (const [segSpanId, segHarnessEl] of segHarnessElRefMap.current.entries()) {
      segHeights[segSpanId] = segHarnessEl.getBoundingClientRect().height
    }

    return segHeights
  }

  queryFgContainerDims() {
    const { rootEl, fcContainerElRefMap } = this
    const rootElTop = rootEl.getBoundingClientRect().top
    const fgContainerTops: { [cellKey: string]: number } = {}
    const fgContainerHeights: { [cellKey: string]: number } = {}

    for (const [cellKey, fgContainerEl] of fcContainerElRefMap.current.entries()) {
      const rect = fgContainerEl.getBoundingClientRect()
      fgContainerTops[cellKey] = rect.top - rootElTop
      fgContainerHeights[cellKey] = rect.height
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
