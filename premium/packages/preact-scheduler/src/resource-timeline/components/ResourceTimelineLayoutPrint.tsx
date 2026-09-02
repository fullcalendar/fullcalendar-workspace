import { CssDimValue, joinClassNames } from '@fullcalendar/preact/public-api'
import {
  afterSize,
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  EventStore,
  generateClassName,
  memoize,
  RefMap,
  SlicedProps,
  SplittableProps,
  ViewContainer,
  computeViewBorderless,
  watchHeight,
  watchWidth,
  warn,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createRef } from 'react'
import { createGroupId, GenericNode } from '../../resource/common/resource-hierarchy'
import { ResourceEntityExpansions } from '../../resource/reducers/resourceEntityExpansions'
import { TimelineDateProfile } from '../../timeline/timeline-date-profile'
import { TimelineHeaderRow } from '../../timeline/components/TimelineHeaderRow'
import { TimelineBg } from '../../timeline/components/TimelineBg'
import { TimelineRange } from '../../timeline/TimelineLaneSlicer'
import { TimelineSlats } from '../../timeline/components/TimelineSlats'
import { DimConfig, serializeDimConfig } from '@full-ui/headless-grid'
import {
  buildPrintLayouts,
  buildPrintTableRows,
} from '../resource-layout-print'
import { GroupLane } from './lane/GroupLane'
import { ResourcePrintRow } from './ResourcePrintRow'
import { ResourceGroupHeaderCell } from './spreadsheet/ResourceGroupHeaderCell'
import { HeaderCells } from './spreadsheet/HeaderCells'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell'
import { ColSpec } from '../structs'
import { computeResourceTimelineHeaderHeight } from '../header-height'

export interface ResourceTimelineLayoutPrintProps {
  className?: string
  labelId: string | undefined
  labelStr: string | undefined

  tDateProfile: TimelineDateProfile
  dateProfile: DateProfile
  resourceHierarchy: GenericNode[]
  resourceEntityExpansions: ResourceEntityExpansions
  hasNesting: boolean

  nowDate: DateMarker
  nowMs: number // exact instant of nowDate
  todayRange: DateRange

  colSpecs: ColSpec[]
  groupColCnt: number
  superHeaderRendering: any

  splitProps: { [key: string]: SplittableProps }
  bgSlicedProps: SlicedProps<TimelineRange>

  hasResourceBusinessHours: boolean
  fallbackBusinessHours: EventStore

  // Overall resource-area width, preserving its percentage and pixel components for liquid print CSS.
  spreadsheetWidthConfig: DimConfig
  // Screen-resolved resource-column pixel widths, used here only to preserve their relative proportions.
  spreadsheetColWidths: number[] | undefined

  timeCanvasClipStart: number
  timeCanvasWidth: number | undefined
  slotWidth: number | undefined
  indentWidth: number | undefined
}

interface ResourceTimelineLayoutPrintState {
  headerHeight?: number
  dividerWidth?: number
}

export class ResourceTimelineLayoutPrint extends BaseComponent<ResourceTimelineLayoutPrintProps, ResourceTimelineLayoutPrintState> {
  state = {} as ResourceTimelineLayoutPrintState

  // memoized
  private buildPrintLayouts = memoize(buildPrintLayouts)
  private buildPrintTableRows = memoize(buildPrintTableRows)

  // handlers
  private handleHeaderRowHeightChange = () => {
    if (!this._isUnmounting) {
      afterSize(this.boundForceUpdate)
    }
  }

  private boundForceUpdate = () => {
    if (!this._isUnmounting) {
      this.forceUpdate()
    }
  }

  // refs
  private headerElRef = createRef<HTMLTableSectionElement>()
  private dividerProbeElRef = createRef<HTMLDivElement>()
  private timelineHeaderRowInnerHeightMap = new RefMap<number, number>(this.handleHeaderRowHeightChange)
  private dataGridHeaderRowInnerHeightMap = new RefMap<boolean, number>(this.handleHeaderRowHeightChange)

  // internal
  private _isUnmounting: boolean
  private disconnectHeaderHeight?: () => void
  private disconnectDividerWidth?: () => void

  render() {
    let {
      props,
      context,
      dataGridHeaderRowInnerHeightMap,
      timelineHeaderRowInnerHeightMap,
    } = this
    let { dateProfile } = props
    let { options, viewSpec } = context
    const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

    const { tDateProfile, todayRange, nowDate, hasNesting } = props
    const { slotWidth, timeCanvasWidth } = props
    const { splitProps, bgSlicedProps, timeCanvasClipStart } = props
    const { superHeaderRendering, groupColCnt, colSpecs } = props

    const { cellRows } = tDateProfile
    const headerContentHeight = computeResourceTimelineHeaderHeight(
      dataGridHeaderRowInnerHeightMap.current,
      timelineHeaderRowInnerHeightMap.current,
      Boolean(superHeaderRendering),
      cellRows.length,
    )
    const tableDisplayInfo = {
      borderlessX,
      borderlessTop,
      borderlessBottom,
      multiMonthColumns: 0,
    }
    const headerDividerClassName = generateClassName(options.slotHeaderDividerClass, {
      inTableHeader: true,
      options: { dayMinWidth: options.dayMinWidth },
    })
    const { resourceHierarchy } = props
    let printLayouts = this.buildPrintLayouts(
      resourceHierarchy,
      hasNesting,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )

    if (printLayouts.length > options.printMaxRows) {
      printLayouts = printLayouts.slice(0, options.printMaxRows)
      warn(`Rows truncated for print. Only included the first ${options.printMaxRows} rows.`)
    }

    const printRows = this.buildPrintTableRows(printLayouts, groupColCnt)
    const resourceColWidths = computeResourceColWidths(
      props.spreadsheetWidthConfig,
      props.spreadsheetColWidths,
      colSpecs.length,
    )
    const dividerWidth = this.state.dividerWidth ?? 0
    const timelineViewportInsetStart = serializeDimConfig({
      pixels: props.spreadsheetWidthConfig.pixels + dividerWidth,
      frac: props.spreadsheetWidthConfig.frac,
    })
    const timelineHeaderCell = (
      <th
        rowSpan={superHeaderRendering ? 2 : undefined}
        className={joinClassNames(
          classNames.noPadding,
          classNames.borderNone,
          classNames.crop,
        )}
      >
        <div
          className={joinClassNames(classNames.rel, classNames.flexCol)}
          style={{
            width: timeCanvasWidth,
            height: headerContentHeight,
            insetInlineStart: -timeCanvasClipStart,
          }}
        >
          {cellRows.map((cells, rowIndex) => {
            const rowLevel = cellRows.length - rowIndex - 1
            return (
              <TimelineHeaderRow
                key={rowLevel}
                className={classNames.grow}
                dateProfile={props.dateProfile}
                tDateProfile={tDateProfile}
                nowDate={nowDate}
                nowMs={props.nowMs}
                todayRange={todayRange}
                rowLevel={rowLevel}
                cells={cells}
                slotWidth={slotWidth}
                innerHeighRef={this.timelineHeaderRowInnerHeightMap.createRef(rowIndex)}
              />
            )
          })}
        </div>
      </th>
    )
    const headerDividerCell = (
      <th
        rowSpan={superHeaderRendering ? 2 : undefined}
        className={joinClassNames(options.resourceColumnDividerClass)}
      />
    )

    return (
      <ViewContainer
        viewSpec={viewSpec}
        className={joinClassNames(
          props.className,
          classNames.rel,
          classNames.crop,
          classNames.isolate,
        )}
      >
        <div
          ref={this.dividerProbeElRef}
          className={joinClassNames(
            options.resourceColumnDividerClass,
            classNames.offscreen,
          )}
        />

        <div
          className={joinClassNames(classNames.abs, classNames.crop)}
          style={{
            zIndex: 0,
            top: this.state.headerHeight ?? 0,
            // Compensates for Firefox miscomputing absolute height with repeated print headers.
            bottom: '-5%',
            insetInlineStart: timelineViewportInsetStart,
            insetInlineEnd: 0,
            pointerEvents: 'none',
          }}
        >
          <TimelineSlats
            dateProfile={dateProfile}
            tDateProfile={tDateProfile}
            nowDate={nowDate}
            nowMs={props.nowMs}
            todayRange={todayRange}
            slotWidth={slotWidth}
            clipStart={timeCanvasClipStart}
          />
          <TimelineBg
            tDateProfile={tDateProfile}
            nowDate={nowDate}
            nowMs={props.nowMs}
            todayRange={todayRange}
            bgEventSegs={bgSlicedProps.bgEventSegs}
            businessHourSegs={null}
            dateSelectionSegs={null}
            eventResizeSegs={null}
            slotWidth={slotWidth}
            clipStart={timeCanvasClipStart}
          />
        </div>

        <table
          className={joinClassNames(
            generateClassName(options.tableClass, tableDisplayInfo),
            classNames.printTable,
            classNames.rel,
          )}
          style={{ zIndex: 1 }}
        >
          <colgroup>
            {colSpecs.map((_colSpec, colIndex) => (
              <col
                key={colIndex}
                style={{ width: resourceColWidths?.[colIndex] }}
              />
            ))}
            <col style={{ width: this.state.dividerWidth }} />
            <col />
          </colgroup>
          <thead
            ref={this.headerElRef}
            className={generateClassName(options.tableHeaderClass, {
              ...tableDisplayInfo,
              isSticky: false,
            })}
          >
            {superHeaderRendering ? (
              <>
                <tr>
                  <SuperHeaderCell
                    renderHooks={superHeaderRendering}
                    indent={hasNesting && !groupColCnt /* group-cols are leftmost, making expander alignment irrelevant */}
                    colSpan={colSpecs.length}
                    indentWidth={props.indentWidth}
                    innerHeightRef={this.dataGridHeaderRowInnerHeightMap.createRef(true)}
                    forPrint
                  />
                  {headerDividerCell}
                  {timelineHeaderCell}
                </tr>
                <tr>
                  <HeaderCells
                    colSpecs={colSpecs}
                    colWidths={undefined}
                    indent={hasNesting}
                    indentWidth={props.indentWidth}
                    innerHeightRef={this.dataGridHeaderRowInnerHeightMap.createRef(false)}
                    forPrint
                  />
                </tr>
              </>
            ) : (
              <tr>
                <HeaderCells
                  colSpecs={colSpecs}
                  colWidths={undefined}
                  indent={hasNesting}
                  indentWidth={props.indentWidth}
                  innerHeightRef={this.dataGridHeaderRowInnerHeightMap.createRef(false)}
                  forPrint
                />
                {headerDividerCell}
                {timelineHeaderCell}
              </tr>
            )}
            {/* Header-divider strip, interleaved with the resource-column divider. */}
            <tr>
              <th
                colSpan={colSpecs.length}
                className={joinClassNames(classNames.noPadding, headerDividerClassName)}
              />
              {/* Prevent the divider cell's vertical padding from increasing the header-border row height. */}
              <th
                className={joinClassNames(
                  options.resourceColumnDividerClass,
                  classNames.noPaddingY,
                )}
              />
              <th className={joinClassNames(classNames.noPadding, headerDividerClassName)} />
            </tr>
          </thead>{/* Header END */}
          {/* Body START */}
          <tbody
            className={generateClassName(options.tableBodyClass, tableDisplayInfo)}
          >
            {/* BODY ROWS */}
            {printRows.map((printRow, rowIndex0) => { // index is 0-based
              const isNotLast = rowIndex0 < printRows.length - 1

              if (printRow.type === 'resource') {
                const resource = printRow.entity

                return (
                  <ResourcePrintRow
                    {...splitProps[resource.id]}
                    key={resource.id}
                    layout={printRow}
                    rowIndex={rowIndex0}
                    rowCount={printRows.length}
                    isNotLast={isNotLast}
                    dateProfile={dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    nowMs={props.nowMs}
                    todayRange={todayRange}
                    colSpecs={colSpecs}
                    groupColCnt={groupColCnt}
                    timeCanvasClipStart={timeCanvasClipStart}
                    slotWidth={slotWidth}
                    indentWidth={props.indentWidth}
                    businessHours={null}
                    dateSelection={null}
                    eventDrag={null}
                    eventResize={null}
                  />
                )
              } else {
                const group = printRow.entity
                const groupKey = createGroupId(group)

                return (
                  <tr
                    key={groupKey}
                    className={classNames.breakInsideAvoid}
                  >
                    <ResourceGroupHeaderCell
                      group={group}
                      isExpanded={printRow.isExpanded}
                      colSpan={props.colSpecs.length}
                      borderBottom={isNotLast}
                      indentWidth={props.indentWidth}
                      forPrint
                    />
                    <td
                      className={joinClassNames(options.resourceColumnDividerClass)}
                    />
                    <GroupLane
                      group={group}
                      borderBottom={isNotLast}
                      forPrint
                    />
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
      </ViewContainer>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
    this.disconnectHeaderHeight = watchHeight(this.headerElRef.current, (headerHeight) => {
      if (!this._isUnmounting && headerHeight !== this.state.headerHeight) {
        this.setState({ headerHeight })
      }
    })
    this.disconnectDividerWidth = watchWidth(this.dividerProbeElRef.current, (dividerWidth) => {
      if (!this._isUnmounting && dividerWidth !== this.state.dividerWidth) {
        this.setState({ dividerWidth })
      }
    })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectHeaderHeight?.()
    this.disconnectDividerWidth?.()
  }
}

function computeResourceColWidths(
  totalConfig: DimConfig,
  pixelWidths: number[] | undefined,
  colCnt: number,
): CssDimValue[] {
  let ratios: number[] | undefined

  if (pixelWidths) {
    const pixelTotal = pixelWidths.reduce((total, width) => total + width, 0)

    if (pixelTotal) {
      ratios = pixelWidths.map((width) => width / pixelTotal)
    }
  }

  // Use equal proportions when screen-resolved column widths are not yet available.
  ratios ??= Array.from({ length: colCnt }, () => 1 / colCnt)

  return ratios.map((ratio) => serializeDimConfig({
    pixels: totalConfig.pixels * ratio,
    frac: totalConfig.frac * ratio,
  }))
}
