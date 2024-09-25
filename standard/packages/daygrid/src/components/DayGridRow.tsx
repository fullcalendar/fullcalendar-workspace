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
  watchHeight,
  guid,
  afterSize,
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
import { DayGridEventHarness } from './DayGridEventHarness.js'

export interface DayGridRowProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cells: DayTableCell[]
  showDayNumbers: boolean
  forPrint: boolean
  cellGroup?: boolean // bad name now
  className?: string // TODO: better API for this
  forceVSpacing?: boolean

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
  minHeight?: number | string

  // refs
  rootElRef?: Ref<HTMLElement> // needed by TimeGrid, to attach Hit system
  heightRef?: Ref<number>
  innerHeightRef?: Ref<number> // only fired if !fgLiquidHeight (so dayMaxEvents !== true && dayMaxEventRows !== true)
}

interface DayGridRowState {
  innerHeight?: number
  headerHeight?: number
  segHeightRev?: string
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'narrow' })

export class DayGridRow extends BaseComponent<DayGridRowProps, DayGridRowState> {
  // ref
  private rootEl: HTMLElement | undefined
  private cellInnerHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleInnerHeights)
  })
  private cellHeaderHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleHeaderHeights)
  })
  private segHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleSegHeights)
  })

  // internal
  private disconnectHeight?: () => void

  render() {
    const { props, state, context, cellInnerHeightRefMap, cellHeaderHeightRefMap } = this
    const { cells } = props
    const { options } = context

    const weekDate = props.cells[0].date
    const colCnt = props.cells.length
    const fgLiquidHeight = props.dayMaxEvents === true || props.dayMaxEventRows === true

    // TODO: memoize? sort all types of segs?
    const fgEventSegs = sortEventSegs(props.fgEventSegs, options.eventOrder) as TableSeg[]

    // TODO: memoize?
    const fgEventSegsByCol = splitSegsByCol(fgEventSegs, colCnt)
    const bgEventSegsByCol = splitSegsByCol(props.bgEventSegs, colCnt)
    const businessHoursByCol = splitSegsByCol(props.businessHourSegs, colCnt)
    const highlightSegsByCol = splitSegsByCol(this.getHighlightSegs(), colCnt) // TODO: doesn't need standins
    const mirrorSegsByCol = splitSegsByCol(this.getMirrorSegs(), colCnt) // TODO: doesn't need standins

    // TODO: memoize?
    const [segTops, heightsByCol, hiddenSegsByCol] = computeFgSegVerticals(
      fgEventSegs,
      this.segHeightRefMap.current,
      cells,
      state.headerHeight,
      (fgLiquidHeight && state.innerHeight != null && state.headerHeight != null)
        ? state.innerHeight - state.headerHeight
        : undefined,
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
        role={props.cellGroup ? undefined : 'row'}
        className={[
          'fcnew-daygrid-row',
          props.forceVSpacing ? 'fcnew-daygrid-row-spacious' : '',
          props.cellGroup ? 'fcnew-flex-row' : 'fcnew-row',
          'fcnew-rel',
          props.className || '',
        ].join(' ')}
        style={{
          minHeight: props.minHeight,
        }}
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
              fgLiquidHeight={fgLiquidHeight}
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
              fgHeight={heightsByCol[col]}
              width={props.colWidth}

              // refs
              innerHeightRef={cellInnerHeightRefMap.createRef(cell.key)}
              headerHeightRef={cellHeaderHeightRefMap.createRef(cell.key)}
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
    const { props, context, segHeightRefMap } = this
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
        <DayGridEventHarness
          key={segSpanId}
          style={{
            visibility: isVisible ? '' : 'hidden',
            top,
            left,
            right,
            width,
          }}
          heightRef={
            (isMirror || seg.isStandin)
              ? null
              : segHeightRefMap.createRef(segSpanId)
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
        </DayGridEventHarness>,
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
      const isVisible = !seg.isStandin

      nodes.push(
        <div
          key={buildEventRangeKey(seg.eventRange)}
          className="fcnew-fill-y"
          style={{
            visibility: isVisible ? '' : 'hidden',
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

  handleRootEl = (rootEl: HTMLElement) => {
    this.rootEl = rootEl
    setRef(this.props.rootElRef, rootEl)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  componentDidMount() {
    const { rootEl } = this // TODO: make dynamic with useEffect

    this.disconnectHeight = watchHeight(rootEl, (contentHeight) => {
      setRef(this.props.heightRef, contentHeight)
    })
  }

  componentWillUnmount(): void {
    this.disconnectHeight()

    setRef(this.props.heightRef, null)
    setRef(this.props.innerHeightRef, null)
  }

  // Sizing
  // -----------------------------------------------------------------------------------------------

  private handleHeaderHeights = () => {
    const cellHeaderHeightMap = this.cellHeaderHeightRefMap.current
    let max = 0

    for (const height of cellHeaderHeightMap.values()) {
      max = Math.max(max, height)
    }

    if (this.state.headerHeight !== max) {
      this.setState({ headerHeight: max })
    }
  }

  private handleInnerHeights = () => {
    const { props } = this
    const fgLiquidHeight = props.dayMaxEvents === true || props.dayMaxEventRows === true
    const cellInnerHeightMap = this.cellInnerHeightRefMap.current
    let max = 0

    for (const height of cellInnerHeightMap.values()) {
      max = Math.max(max, height)
    }

    if (fgLiquidHeight) {
      if (this.state.innerHeight !== max) {
        this.setState({ innerHeight: max }) // will trigger event rerender
      }
    } else {
      setRef(props.innerHeightRef, max)
    }
  }

  private handleSegHeights = () => {
    this.setState({ segHeightRev: guid() }) // will trigger event rerender
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
