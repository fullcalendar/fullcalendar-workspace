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
  getUniqueDomId,
} from '@fullcalendar/core/internal'
import {
  VNode,
  createElement,
  Fragment,
  Ref,
} from '@fullcalendar/core/preact'
import { DayRowEventRangePart, getEventPartKey } from '../TableSeg.js'
import { DayGridCell } from './DayGridCell.js'
import { DayGridListEvent } from './DayGridListEvent.js'
import { DayGridBlockEvent } from './DayGridBlockEvent.js'
import { computeFgSegVerticals } from '../event-placement.js'
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
  className?: string
  isCompact?: boolean
  isTall?: boolean
  role?: string

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
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'narrow' })

const RENDER_STANDINS = false

export class DayGridRow extends BaseComponent<DayGridRowProps> {
  // ref
  private rootEl: HTMLElement | undefined
  private headerHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleSegPositioning)
  })
  private mainHeightRefMap = new RefMap<string, number>(() => {
    const fgLiquidHeight = this.props.dayMaxEvents === true || this.props.dayMaxEventRows === true
    if (fgLiquidHeight) {
      afterSize(this.handleSegPositioning)
    }
  })
  private segHeightRefMap = new RefMap<string, number>(() => {
    afterSize(this.handleSegPositioning)
  })

  // internal
  private disconnectHeight?: () => void
  private titleDomId = getUniqueDomId()

  render() {
    const { props, context, headerHeightRefMap, mainHeightRefMap } = this
    const { cells } = props
    const { options } = context

    const weekDate = props.cells[0].date
    const fgLiquidHeight = props.dayMaxEvents === true || props.dayMaxEventRows === true

    // TODO: memoize? sort all types of segs?
    const fgEventSegs = sortEventSegs(props.fgEventSegs, options.eventOrder)

    // TODO: memoize?
    const [maxMainTop, minMainHeight] = this.computeFgDims() // uses headerHeightRefMap/mainHeightRefMap
    const [segsByCol, hiddenSegsByCol, renderableSegsByCol, segTops, simpleHeightsByCol] = computeFgSegVerticals(
      fgEventSegs,
      this.segHeightRefMap.current,
      cells,
      fgLiquidHeight ? minMainHeight : undefined, // if not defined in first run, will unlimited!?
      options.eventOrderStrict,
      options.eventSlicing,
      props.dayMaxEvents,
      props.dayMaxEventRows,
    )
    const heightsByCol: number[] = []
    if (maxMainTop != null) {
      let col = 0
      for (const cell of cells) { // uses headerHeightRefMap/maxMainTop/simpleHeightsByCol
        const cellHeaderHeight = headerHeightRefMap.current.get(cell.key)
        const extraFgHeight = maxMainTop - cellHeaderHeight
        heightsByCol.push(simpleHeightsByCol[col++] + extraFgHeight)
      }
    }

    const highlightSegs = this.getHighlightSegs()
    const mirrorSegs = this.getMirrorSegs()

    const forcedInvisibleMap = // TODO: more convenient/DRY
      (props.eventDrag && props.eventDrag.affectedInstances) ||
      (props.eventResize && props.eventResize.affectedInstances) ||
      {}

    return (
      <div
        role={props.role as any /* !!! */}
        aria-labelledby={props.showWeekNumbers ? this.titleDomId : undefined}
        className={joinClassNames(
          'fc-flex-row fc-rel',
          props.className,
        )}
        style={{
          minHeight: props.minHeight,
        }}
        ref={this.handleRootEl}
      >
        {this.renderFillSegs(props.businessHourSegs, 'non-business')}
        {this.renderFillSegs(props.bgEventSegs, 'bg-event')}
        {this.renderFillSegs(highlightSegs, 'highlight')}
        <div className='fc-flex-row fc-liquid fc-rel'>{/* relative to compete w/ bg z-indexes */}
          {props.cells.map((cell, col) => {
            const normalFgNodes = this.renderFgSegs(
              maxMainTop,
              renderableSegsByCol[col],
              segTops,
              props.todayRange,
              forcedInvisibleMap,
            )

            return (
              <DayGridCell
                key={cell.key}
                dateProfile={props.dateProfile}
                todayRange={props.todayRange}
                date={cell.date}
                showDayNumber={props.showDayNumbers}
                isCompact={props.isCompact}
                isTall={props.isTall}
                borderStart={Boolean(col)}

                // content
                segs={segsByCol[col]}
                hiddenSegs={hiddenSegsByCol[col]}
                fgLiquidHeight={fgLiquidHeight}
                fg={(
                  <Fragment>
                    {normalFgNodes}
                  </Fragment>
                )}
                eventDrag={props.eventDrag}
                eventResize={props.eventResize}
                eventSelection={props.eventSelection}

                // render hooks
                renderProps={cell.renderProps}
                dateSpanProps={cell.dateSpanProps}
                attrs={cell.attrs}
                className={cell.className} // just semantic classname. if discarded because of disabled cell, okay

                // dimensions
                fgHeight={heightsByCol[col]}
                width={props.colWidth}

                // refs
                headerHeightRef={headerHeightRefMap.createRef(cell.key)}
                mainHeightRef={mainHeightRefMap.createRef(cell.key)}
              />
            )
          })}
        </div>
        {props.showWeekNumbers && (
          <WeekNumberContainer
            tag={options.navLinks ? 'a' : 'div'}
            attrs={{
              id: this.titleDomId,
              ...buildNavLinkAttrs(context, weekDate, 'week'),
            }}
            className='fc-daygrid-week-number'
            date={weekDate}
            defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
          />
        )}
        {this.renderFgSegs(
          maxMainTop,
          mirrorSegs,
          segTops,
          props.todayRange,
          {}, // forcedInvisibleMap
          Boolean(props.eventDrag),
          Boolean(props.eventResize),
          false, // date-selecting (because mirror is never drawn for date selection)
        )}
      </div>
    )
  }

  renderFgSegs(
    headerHeight: number | undefined,
    segs: DayRowEventRangePart[],
    segTops: Map<string, number>,
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
      const key = getEventPartKey(seg)
      const { standinFor, eventRange } = seg
      const { instanceId } = eventRange.instance

      if (!RENDER_STANDINS && standinFor) {
        continue
      }

      const { left, right } = computeHorizontalsFromSeg(seg, colWidth, colCnt, isRtl)
      const localTop = segTops.get(standinFor ? getEventPartKey(standinFor) : key) ?? (isMirror ? 0 : undefined)
      const top = headerHeight != null && localTop != null
        ? headerHeight + localTop
        : undefined
      const isInvisible = standinFor || forcedInvisibleMap[instanceId] || top == null

      nodes.push(
        <DayGridEventHarness
          key={key}
          className={seg.start ? 'fc-border-transparent fc-border-s' : ''}
          style={{
            visibility: isInvisible ? 'hidden' : '',
            top,
            left,
            right,
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
      const { left, right } = computeHorizontalsFromSeg(seg, colWidth, colCnt, isRtl)
      const isVisible = !seg.standinFor

      nodes.push(
        <div
          key={key}
          className="fc-fill-y"
          style={{
            visibility: isVisible ? '' : 'hidden',
            left,
            right,
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

    return createElement(Fragment, {}, ...nodes) // TODO: shouldn't this be an array, so keyed?
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
  }

  computeFgDims(): [maxMainTop: number | undefined, minMainHeight: number | undefined] {
    const { cells } = this.props
    const headerHeightMap = this.headerHeightRefMap.current
    const mainHeightMap = this.mainHeightRefMap.current
    let maxMainTop: number | undefined
    let minMainBottom: number | undefined

    for (const cell of cells) {
      const mainTop = headerHeightMap.get(cell.key)
      const mainHeight = mainHeightMap.get(cell.key)

      if (mainTop != null) {
        if (maxMainTop === undefined || mainTop > maxMainTop) {
          maxMainTop = mainTop
        }

        if (mainHeight != null) {
          const mainBottom = mainTop + mainHeight

          if (minMainBottom === undefined || mainBottom < minMainBottom) {
            minMainBottom = mainBottom
          }
        }
      }
    }

    return [
      maxMainTop,
      minMainBottom != null && maxMainTop != null
        ? minMainBottom - maxMainTop
        : undefined,
    ]
  }

  private handleSegPositioning = () => {
    this.forceUpdate()
  }

  // Internal Utils
  // -----------------------------------------------------------------------------------------------

  private getMirrorSegs(): (SlicedCoordRange & EventRangeProps)[] {
    let { props } = this

    if (props.eventResize && props.eventResize.segs.length) { // messy check
      return props.eventResize.segs
    }

    return []
  }

  private getHighlightSegs(): (SlicedCoordRange & EventRangeProps)[] {
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
