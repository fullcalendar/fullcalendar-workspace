import {
  EventSegUiInteractionState,
  BaseComponent,
  DateRange,
  getEventRangeMeta,
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
  afterSize,
  SlicedCoordRange,
  EventRangeProps,
  joinClassNames,
} from '@fullcalendar/core/internal'
import {
  VNode,
  createElement,
  Fragment,
  Ref,
} from '@fullcalendar/core/preact'
import { DayRowEventRangePart, getEventPartKey, organizeSegsByStartCol } from '../TableSeg.js'
import { DayGridCell } from './DayGridCell.js'
import { DayGridListEvent } from './DayGridListEvent.js'
import { DayGridBlockEvent } from './DayGridBlockEvent.js'
import { computeFgSegVerticals, ENABLE_STANDINS, sliceSegsAcrossCols } from '../event-placement.js'
import { hasListItemDisplay } from '../event-rendering.js'
import { computeHorizontalsFromSeg } from './util.js'
import { DayGridEventHarness } from './DayGridEventHarness.js'

export interface DayGridRowProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cells: DayTableCell[]
  showDayNumbers: boolean
  showWeekNumbers?: boolean
  forPrint: boolean
  cellGroup?: boolean // bad name now
  className?: string // TODO: better API for this
  forceVSpacing?: boolean
  compact?: boolean

  // content
  fgEventSegs: (SlicedCoordRange & EventRangeProps)[]
  bgEventSegs: (SlicedCoordRange & EventRangeProps)[]
  businessHourSegs: (SlicedCoordRange & EventRangeProps)[]
  dateSelectionSegs: (SlicedCoordRange & EventRangeProps)[]
  eventDrag: EventSegUiInteractionState<SlicedCoordRange> | null
  eventResize: EventSegUiInteractionState<SlicedCoordRange> | null
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

export const COMPACT_CELL_WIDTH = 80

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
    const fgEventSegs = sortEventSegs(props.fgEventSegs, options.eventOrder)

    // TODO: memoize?
    const [segsByCol, hiddenSegsByCol, renderableSegsByCol, segTops, heightsByCol] = computeFgSegVerticals(
      fgEventSegs,
      this.segHeightRefMap.current,
      cells,
      (fgLiquidHeight && state.innerHeight != null && state.headerHeight != null)
        ? state.innerHeight - state.headerHeight
        : undefined,
      options.eventOrderStrict,
      options.eventSlicing,
      props.dayMaxEvents,
      props.dayMaxEventRows,
    )

    // TODO: memoize?
    const bgEventSegsByCol = (ENABLE_STANDINS ? sliceSegsAcrossCols : organizeSegsByStartCol)(
      props.bgEventSegs,
      colCnt
    )
    const businessHoursByCol = organizeSegsByStartCol(props.businessHourSegs, colCnt)
    const highlightSegsByCol = organizeSegsByStartCol(this.getHighlightSegs(), colCnt)
    const mirrorSegsByCol = organizeSegsByStartCol(this.getMirrorSegs(), colCnt)

    const forcedInvisibleMap = // TODO: more convenient/DRY
      (props.eventDrag && props.eventDrag.affectedInstances) ||
      (props.eventResize && props.eventResize.affectedInstances) ||
      {}

    return (
      <div
        role={props.cellGroup ? undefined : 'row'}
        className={joinClassNames(
          props.className,
          'fc-daygrid-row',
          props.forceVSpacing
            ? 'fc-daygrid-row-spacious'
            : props.compact
              &&'fc-daygrid-row-compact',
          props.cellGroup ? 'fc-flex-row' : 'fc-row',
          'fc-rel',
        )}
        style={{
          minHeight: props.minHeight,
        }}
        ref={this.handleRootEl}
      >
        {props.showWeekNumbers && (
          <WeekNumberContainer
            elTag="a"
            elClassName='fc-daygrid-week-number'
            elAttrs={buildNavLinkAttrs(context, weekDate, 'week')}
            date={weekDate}
            defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
          />
        )}
        {props.cells.map((cell, col) => {
          const normalFgNodes = this.renderFgSegs(
            renderableSegsByCol[col],
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
              segs={segsByCol[col]}
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
              extraClassName={cell.extraClassName}

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
    segs: DayRowEventRangePart[],
    segTops: Map<string, number>,
    todayRange: DateRange,
    forcedInvisibleMap: { [instanceId: string]: any },
    isDragging?: boolean,
    isResizing?: boolean,
    isDateSelecting?: boolean,
  ): VNode[] {
    const { props, state, context, segHeightRefMap } = this
    const { isRtl } = context
    const { colWidth, eventSelection } = props
    const { headerHeight } = state

    const colCnt = props.cells.length
    const defaultDisplayEventEnd = props.cells.length === 1
    const isMirror = isDragging || isResizing || isDateSelecting
    const nodes: VNode[] = []

    for (const seg of segs) {
      const key = getEventPartKey(seg)
      const { standinFor, eventRange } = seg
      const { instanceId } = eventRange.instance

      if (!ENABLE_STANDINS && standinFor) {
        continue
      }

      const { left, right, width } = computeHorizontalsFromSeg(seg, colWidth, colCnt, isRtl)
      const localTop = segTops.get(standinFor ? getEventPartKey(standinFor) : key) ?? (isMirror ? 0 : undefined)
      const top = (headerHeight != null && localTop != null) ? headerHeight + localTop : undefined
      const isInvisible = standinFor || forcedInvisibleMap[instanceId] || top == null

      nodes.push(
        <DayGridEventHarness
          key={key}
          style={{
            visibility: isInvisible ? 'hidden' : '',
            top,
            left,
            right,
            width,
          }}
          heightRef={
            (!standinFor && !isMirror)
              ? segHeightRefMap.createRef(key)
              : null
          }
        >
          {hasListItemDisplay(seg) ? (
            <DayGridListEvent
              eventRange={eventRange}
              isStart={seg.isStart}
              isEnd={seg.isEnd}
              isDragging={isDragging}
              isSelected={instanceId === eventSelection}
              defaultDisplayEventEnd={defaultDisplayEventEnd}
              {...getEventRangeMeta(eventRange, todayRange)}
            />
          ) : (
            <DayGridBlockEvent
              eventRange={eventRange}
              isStart={seg.isStart}
              isEnd={seg.isEnd}
              isDragging={isDragging}
              isResizing={isResizing}
              isDateSelecting={isDateSelecting}
              isSelected={instanceId === eventSelection}
              defaultDisplayEventEnd={defaultDisplayEventEnd}
              {...getEventRangeMeta(eventRange, todayRange)}
            />
          )}
        </DayGridEventHarness>,
      )
    }

    return nodes
  }

  renderFillSegs(
    segs: DayRowEventRangePart[],
    fillType: string,
  ): VNode {
    const { props, context } = this
    const { isRtl } = context
    const { todayRange, colWidth } = props

    const colCnt = props.cells.length
    const nodes: VNode[] = []

    for (const seg of segs) {
      const key = buildEventRangeKey(seg.eventRange) // TODO: use different type of key than fg!?
      const { left, right, width } = computeHorizontalsFromSeg(seg, colWidth, colCnt, isRtl)
      const isVisible = !seg.standinFor

      nodes.push(
        <div
          key={key}
          className="fc-fill-y"
          style={{
            visibility: isVisible ? '' : 'hidden',
            left,
            right,
            width,
          }}
        >
          {fillType === 'bg-event' ?
            <BgEvent
              eventRange={seg.eventRange}
              isStart={seg.isStart}
              isEnd={seg.isEnd}
              {...getEventRangeMeta(seg.eventRange, todayRange)}
            /> : (
              renderFill(fillType)
            )
          }
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
    this.setState({ segHeightRev: this.segHeightRefMap.rev }) // will trigger event rerender
  }

  // Utils
  // -----------------------------------------------------------------------------------------------

  getMirrorSegs(): (SlicedCoordRange & EventRangeProps)[] {
    let { props } = this

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs
    }

    return []
  }

  getHighlightSegs(): (SlicedCoordRange & EventRangeProps)[] {
    let { props } = this

    if (props.eventDrag && props.eventDrag.segs.length) { // messy check
      return props.eventDrag.segs
    }

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs
    }

    return props.dateSelectionSegs
  }
}
