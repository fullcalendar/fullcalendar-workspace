import { InlineWeekNumberData } from '@fullcalendar/core'
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
  watchHeight,
  afterSize,
  SlicedCoordRange,
  EventRangeProps,
  buildDateStr,
  buildNavLinkAttrs,
  joinArrayishClassNames,
  renderText,
  ContentContainer,
  StandardEvent,
  memoize,
  generateClassName,
} from '@fullcalendar/core/internal'
import {
  VNode,
  createElement,
  Fragment,
  Ref,
} from '@fullcalendar/core/preact'
import { DayRowEventRangePart, getEventPartKey } from '../TableSeg.js'
import { DayGridCell } from './DayGridCell.js'
import { computeFgSegVerticals } from '../event-placement.js'
import { DEFAULT_TABLE_EVENT_TIME_FORMAT, hasListItemDisplay } from '../event-rendering.js'
import { computeHorizontalsFromSeg } from './util.js'
import { DayGridEventHarness } from './DayGridEventHarness.js'
import classNames from '@fullcalendar/core/internal-classnames'
import { DateMarker } from '@fullcalendar/core/internal'
import { ViewContext } from '@fullcalendar/core/internal'

export interface DayGridRowProps {
  dateProfile: DateProfile
  todayRange: DateRange
  cells: DayTableCell[]
  cellIsCompact: boolean
  showDayNumbers: boolean
  showWeekNumbers?: boolean
  forPrint: boolean
  className?: string
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
  colWidth?: number // the applied width (NOT the computed width)
  basis?: number // height before growing

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

  // memo
  private buildWeekNumberRenderProps = memoize(buildWeekNumberRenderProps)

  // internal
  private disconnectHeight?: () => void

  render() {
    const { props, context, headerHeightRefMap, mainHeightRefMap } = this
    const { cells } = props
    const { options } = context

    const weekDateMarker = props.cells[0].date
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

    const hasNavLink = options.navLinks
    const fullWeekStr = buildDateStr(context, weekDateMarker, 'week')

    const weekNumberRenderProps = this.buildWeekNumberRenderProps(
      weekDateMarker,
      context,
      props.cellIsCompact,
      hasNavLink,
    )

    return (
      <div
        role={props.role as any /* !!! */}
        aria-label={
          props.role === 'row' // HACK
            ? fullWeekStr
            : undefined // can't have label on non-role div
        }
        className={joinArrayishClassNames(
          options.dayRowClass,
          props.className,
          classNames.flexRow,
          classNames.rel,
          (props.forPrint && props.basis !== undefined) && // basis implies siblings (must share height)
            classNames.printSiblingRow,
        )}
        style={{
          'flex-basis': props.basis,
          zIndex: 0, // contain child z-indexes
        }}
        ref={this.handleRootEl}
      >
        {props.showWeekNumbers && (
          <ContentContainer<InlineWeekNumberData>
            tag='div'
            renderProps={weekNumberRenderProps}
            generatorName="inlineWeekNumberContent"
            customGenerator={options.inlineWeekNumberContent}
            defaultGenerator={renderText}
            classNameGenerator={options.inlineWeekNumberClass}
            didMount={options.inlineWeekNumberDidMount}
            willUnmount={options.inlineWeekNumberWillUnmount}
          >
            {(InnerContent) => (
              <InnerContent
                tag='div'
                attrs={{
                  ...(
                    hasNavLink
                      ? buildNavLinkAttrs(context, weekDateMarker, 'week', fullWeekStr, /* isTabbable = */ false)
                      : {}
                  ),
                  'role': undefined, // HACK: a 'link' role can't be child of 'row' role
                  'aria-hidden': true, // HACK: never part of a11y tree because row already has label and role not allowed
                }}
                className={generateClassName(options.inlineWeekNumberInnerClass, weekNumberRenderProps)}
              />
            )}
          </ContentContainer>
        )}
        {this.renderFillSegs(props.businessHourSegs, 'non-business')}
        {this.renderFillSegs(props.bgEventSegs, 'bg-event')}
        {this.renderFillSegs(highlightSegs, 'highlight')}
        {props.cells.map((cell, col) => {
          const normalFgNodes = this.renderFgSegs(
            maxMainTop,
            renderableSegsByCol[col],
            segTops,
            props.todayRange,
            /* isMirror = */ false,
          )

          return (
            <DayGridCell
              key={cell.key}
              dateProfile={props.dateProfile}
              todayRange={props.todayRange}
              date={cell.date}
              isMajor={cell.isMajor}
              showDayNumber={props.showDayNumbers}
              isCompact={props.cellIsCompact}
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
              className={cell.className}

              // dimensions
              fgHeight={heightsByCol[col]}
              width={props.colWidth}

              // refs
              headerHeightRef={headerHeightRefMap.createRef(cell.key)}
              mainHeightRef={mainHeightRefMap.createRef(cell.key)}
            />
          )
        })}
        {this.renderFgSegs(
          maxMainTop,
          mirrorSegs,
          segTops,
          props.todayRange,
          /* isMirror = */ true,
        )}
      </div>
    )
  }

  renderFgSegs(
    headerHeight: number | undefined,
    segs: DayRowEventRangePart[],
    segTops: Map<string, number>,
    todayRange: DateRange,
    isMirror: boolean,
  ): VNode[] {
    const { props, context, segHeightRefMap } = this
    const { isRtl } = context
    const { colWidth, eventSelection } = props

    const colCount = props.cells.length
    const defaultDisplayEventEnd = props.cells.length === 1
    const nodes: VNode[] = []

    for (const seg of segs) {
      const key = getEventPartKey(seg)
      const { standinFor, eventRange } = seg
      const { instanceId } = eventRange.instance

      if (!RENDER_STANDINS && standinFor) {
        continue
      }

      const { left, right } = computeHorizontalsFromSeg(seg, colWidth, colCount, isRtl)
      const localTop = segTops.get(standinFor ? getEventPartKey(standinFor) : key) ?? (isMirror ? 0 : undefined)
      const top = headerHeight != null && localTop != null
        ? headerHeight + localTop
        : undefined

      const isDragging = Boolean(props.eventDrag && props.eventDrag.affectedInstances[instanceId])
      const isResizing = Boolean(props.eventResize && props.eventResize.affectedInstances[instanceId])
      const isInvisible = !isMirror && (isDragging || isResizing || standinFor || top == null)
      const isListItem = hasListItemDisplay(seg)

      nodes.push(
        <DayGridEventHarness
          key={key}
          className={seg.start ? classNames.fakeBorderS : ''}
          style={{
            visibility: isInvisible ? 'hidden' : undefined,
            top,
            left,
            right,
            zIndex: 0, // container inner z-indexes
          }}
          heightRef={
            (!standinFor && !isMirror)
              ? segHeightRefMap.createRef(key)
              : null
          }
        >
          <StandardEvent
            display={isListItem ? 'list-item' : 'row'}
            eventRange={eventRange}
            isStart={seg.isStart}
            isEnd={seg.isEnd}
            isDragging={isDragging}
            isResizing={isResizing}
            isMirror={isMirror}
            isSelected={instanceId === eventSelection}
            isCompact={props.cellIsCompact}
            defaultTimeFormat={DEFAULT_TABLE_EVENT_TIME_FORMAT}
            defaultDisplayEventEnd={defaultDisplayEventEnd}
            disableResizing={isListItem}
            {...getEventRangeMeta(eventRange, todayRange)}
          />
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

    const colCount = props.cells.length
    const nodes: VNode[] = []

    for (const seg of segs) {
      const key = buildEventRangeKey(seg.eventRange) // TODO: use different type of key than fg!?
      const { left, right } = computeHorizontalsFromSeg(seg, colWidth, colCount, isRtl)
      const isVisible = !seg.standinFor

      nodes.push(
        <div
          key={key}
          className={classNames.fillY}
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
              isCompact={props.cellIsCompact}
              {...getEventRangeMeta(seg.eventRange, todayRange)}
            /> : (
              renderFill(fillType, context.options)
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

// Utils
// -------------------------------------------------------------------------------------------------

function buildWeekNumberRenderProps(
  weekDateMarker: DateMarker,
  context: ViewContext,
  isCompact: boolean,
  hasNavLink: boolean,
): InlineWeekNumberData {
  const { dateEnv, options } = context
  const weekNum = dateEnv.computeWeekNumber(weekDateMarker)
  const [weekNumText, weekNumTextParts] = dateEnv.format(
    weekDateMarker,
    options.weekNumberFormat || DEFAULT_WEEK_NUM_FORMAT
  )
  const weekDateZoned = dateEnv.toDate(weekDateMarker)
  return {
    num: weekNum,
    text: weekNumText,
    textParts: weekNumTextParts,
    date: weekDateZoned,
    isCompact,
    hasNavLink,
  }
}
