import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  EventStore,
  generateClassName,
  joinArrayishClassNames,
  memoize,
  rangeContainsMarker,
  SlicedProps,
  SplittableProps,
  ViewContainer,
  computeViewBorderless,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createGroupId, GenericNode } from '../../resource/common/resource-hierarchy'
import { ResourceEntityExpansions } from '../../resource/reducers/resourceEntityExpansions'
import { TimelineDateProfile } from '../../timeline/timeline-date-profile'
import { TimelineHeaderRow } from '../../timeline/components/TimelineHeaderRow'
import { TimelineBg } from '../../timeline/components/TimelineBg'
import { TimelineNowIndicatorArrow } from '../../timeline/components/TimelineNowIndicatorArrow'
import { TimelineNowIndicatorLine } from '../../timeline/components/TimelineNowIndicatorLine'
import { TimelineRange } from '../../timeline/TimelineLaneSlicer'
import { TimelineSlats } from '../../timeline/components/TimelineSlats'
import { flexifyDimConfigs, SiblingDimConfig } from '@full-ui/headless-grid'
import { buildPrintLayouts, GroupRowPrintLayout, ResourcePrintLayout } from '../resource-layout-print'
import { GroupLane } from './lane/GroupLane'
import { ResourceLane } from './lane/ResourceLane'
import { ResourceGroupHeaderSubrow } from './spreadsheet/ResourceGroupHeaderSubrow'
import { HeaderRow } from './spreadsheet/HeaderRow'
import { ResourceSubrow } from './spreadsheet/ResourceSubrow'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell'
import { ResourceGroupSubrows } from './spreadsheet/ResourceGroupSubrows'
import { CssDimValue } from '@fullcalendar/preact/public-api'
import { ColSpec } from '../structs'

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
  todayRange: DateRange

  colSpecs: ColSpec[]
  groupColCnt: number
  superHeaderRendering: any

  splitProps: { [key: string]: SplittableProps }
  bgSlicedProps: SlicedProps<TimelineRange>

  hasResourceBusinessHours: boolean
  fallbackBusinessHours: EventStore

  spreadsheetWidth: CssDimValue // the CSS dimension. could be percent
  spreadsheetColWidthConfigs: SiblingDimConfig[]
  spreadsheetColWidths: number[]
  timeAreaOffset: number // always positive (TODO: change to negative?)
  timeCanvasWidth: number | undefined
  slotWidth: number | undefined
  indentWidth: number | undefined

}

const BG_HEIGHT = 100000

/*
ARIA considerations:
try to put correct role="" on things, just for readability, but it's pointless to pursue more
complex things like indexes, level, complex-header relationships (via aria-labelledby)
*/
export class ResourceTimelineLayoutPrint extends BaseComponent<ResourceTimelineLayoutPrintProps> {
  // memoized
  private buildPrintLayouts = memoize(buildPrintLayouts)
  private compileColWidths = memoize(compileColWidths)

  render() {
    let { props, context } = this
    let { dateProfile } = props
    let { options, viewSpec } = context
    const { borderlessX, borderlessTop, borderlessBottom } = computeViewBorderless(options)

    const { tDateProfile, todayRange, nowDate, hasNesting } = props
    const { slotWidth, timeCanvasWidth } = props
    const { hasResourceBusinessHours, fallbackBusinessHours } = props
    const { splitProps, bgSlicedProps, timeAreaOffset } = props
    const { superHeaderRendering, groupColCnt, colSpecs } = props

    const [colWidths, colGrows, spreadsheetCanvasWidth] = this.compileColWidths(
      props.spreadsheetColWidthConfigs,
      props.spreadsheetColWidths,
    )

    const { cellRows } = tDateProfile

    const { resourceHierarchy } = props
    const printLayouts = this.buildPrintLayouts(
      resourceHierarchy,
      hasNesting,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )

    const enableNowIndicator = // TODO: DRY
      options.nowIndicator &&
      slotWidth != null &&
      rangeContainsMarker(props.dateProfile.currentRange, nowDate)

    return (
      <ViewContainer
        viewSpec={viewSpec}
        attrs={{
          role: hasNesting ? 'treegrid' : 'grid', // TODO: DRY
          'aria-label': props.labelStr,
          'aria-labelledby': props.labelId,
        }}
        className={joinArrayishClassNames(
          props.className,
          generateClassName(options.tableClass, {
            borderlessX,
            borderlessTop,
            borderlessBottom,
            multiMonthColumnCount: 0,
          }),
          classNames.printRoot, // either flexCol or table
        )}
      >
        <div className={joinClassNames(
          generateClassName(options.tableHeaderClass, {
            isSticky: false,
            borderlessX,
            borderlessTop,
            borderlessBottom,
            multiMonthColumnCount: 0,
          }),
          classNames.printHeader, // either flexCol or table-header-group
        )}>
          <div className={classNames.flexRow}>

            {/* DataGrid HEADER */}
            <div
              role='rowgroup'
              className={classNames.flexCol}
              style={{ width: props.spreadsheetWidth }}
            >
              {Boolean(superHeaderRendering) && (
                <div
                  role='row'
                  className={joinArrayishClassNames(
                    options.resourceHeaderRowClass,
                    classNames.flexRow,
                    classNames.grow,
                    classNames.borderOnlyB,
                  )}
                >
                  <SuperHeaderCell
                    renderHooks={superHeaderRendering}
                    indent={hasNesting && !groupColCnt /* group-cols are leftmost, making expander alignment irrelevant */}
                    colSpan={colSpecs.length}
                    indentWidth={props.indentWidth}
                  />
                </div>
              )}
              <div // pseudo-viewport
                className={joinClassNames(
                  classNames.flexCol,
                  classNames.grow,
                  classNames.crop,
                )}
              >
                <div // canvas
                  className={joinClassNames(
                    classNames.grow, // height-grow, for matching height with timeline axis
                    classNames.flexCol,
                  )}
                  style={{ minWidth: spreadsheetCanvasWidth }}
                >
                  <HeaderRow
                    colSpecs={colSpecs}
                    colWidths={colWidths}
                    colGrows={colGrows}
                    indent={hasNesting}
                    indentWidth={props.indentWidth}
                  />
                </div>
              </div>
            </div>

            <div
              className={joinArrayishClassNames(options.resourceColumnDividerClass)}
            />

            {/* Timeline HEADER */}
            <div className={joinClassNames(
              classNames.liquid,
              classNames.flexRow,
              classNames.crop,
            )}>
              <div // the canvas, origin for now-indicator
                className={joinClassNames(
                  classNames.flexCol,
                  classNames.rel,
                )}
                style={{
                  width: timeCanvasWidth,
                  insetInlineStart: -timeAreaOffset,
                }}
              >
                {cellRows.map((cells, rowIndex) => {
                  const rowLevel = cellRows.length - rowIndex - 1
                  return (
                    <TimelineHeaderRow
                      key={rowLevel}
                      dateProfile={props.dateProfile}
                      tDateProfile={tDateProfile}
                      nowDate={nowDate}
                      todayRange={todayRange}
                      rowLevel={rowLevel}
                      cells={cells}
                      slotWidth={slotWidth}
                    />
                  )
                })}
                {enableNowIndicator && (
                  // TODO: make this positioned WITHIN padding
                  <TimelineNowIndicatorArrow
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    slotWidth={slotWidth}
                  />
                )}
              </div>
            </div>

          </div>
          <div
            className={generateClassName(options.slotHeaderDividerClass, {
              inTableHeader: true,
              options: { dayMinWidth: options.dayMinWidth },
            })}
          />
        </div>{/* Header END */}
        {/* Body START */}
        {/* Must crop the 200% vertical-line fill */}
        <div
          role='rowgroup'
          className={joinArrayishClassNames(
            generateClassName(options.tableBodyClass, {
              borderlessX,
              borderlessTop,
              borderlessBottom,
              multiMonthColumnCount: 0,
            }),
            // leave display:block for print!
            classNames.rel,
            classNames.crop,
          )}
        >

          {/* BACKGROUND FILL */}
          {/* Must crop horizontally-offscreen slats and whatnot */}
          {/* TODO: more DRY */}
          <div
            aria-hidden
            className={joinClassNames(
              classNames.fillY,
              classNames.flexRow
            )}
            style={{
              // HACK for print where header-height prevents absolutely-positioned events
              // from falling short in height for subsequent pages
              height: BG_HEIGHT,

              // TODO: add the divider width too!!!
              insetInlineStart: props.spreadsheetWidth,
              insetInlineEnd: 0,
            }}
          >
            <div // needed for width
              className={joinClassNames(
                options.resourceColumnDividerClass,
                classNames.invisible,
              )}
            />
            <div // viewport
              className={joinClassNames(
                classNames.liquidX,
                classNames.crop,
                classNames.rel,
              )}
            >
              <div
                className={classNames.fillY}
                style={{
                  width: timeCanvasWidth,
                  height: BG_HEIGHT, // HACK
                  insetInlineStart:  -timeAreaOffset,
                }}
              >
                <TimelineSlats
                  dateProfile={dateProfile}
                  tDateProfile={tDateProfile}
                  nowDate={nowDate}
                  todayRange={todayRange}
                  height={BG_HEIGHT} // HACK

                  // dimensions
                  slotWidth={slotWidth}
                />
                <TimelineBg
                  tDateProfile={tDateProfile}
                  nowDate={nowDate}
                  todayRange={todayRange}

                  // content
                  bgEventSegs={bgSlicedProps.bgEventSegs}
                  businessHourSegs={hasResourceBusinessHours ? null : bgSlicedProps.businessHourSegs}
                  dateSelectionSegs={bgSlicedProps.dateSelectionSegs}
                  eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs : null)}

                  // dimensions
                  slotWidth={slotWidth}
                />
                {enableNowIndicator && (
                  <TimelineNowIndicatorLine
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    slotWidth={slotWidth}
                  />
                )}
              </div>
            </div>
          </div>

          {/* BODY ROWS */}
          {printLayouts.map((printLayout, rowIndex0) => { // index is 0-based
            const isNotLast = rowIndex0 < printLayouts.length - 1

            if ((printLayout as ResourcePrintLayout).colGroups) {
              const resource = (printLayout as ResourcePrintLayout).entity
              const colGroupStats = createColGroupStats(
                printLayout as ResourcePrintLayout,
                printLayouts[rowIndex0 - 1],
                printLayouts[rowIndex0 + 1]
              )

              return (
                <div
                  key={resource.id}
                  role='row'
                  // sort-of a HACK to use .indent, but works out fine b/c 1-based
                  aria-level={hasNesting ? printLayout.indent : undefined}
                  className={joinClassNames(
                    classNames.flexRow,
                    classNames.breakInsideAvoid,
                  )}
                >
                  <div // serves as datagrid viewport
                    className={joinClassNames(
                      classNames.flexCol, // mimics what non-print scrollpane does
                      classNames.crop,
                    )}
                    style={{ width: props.spreadsheetWidth }}
                  >
                    <div // serves as datagrid row
                      className={joinClassNames(
                        classNames.grow, // height-grow, for matching tall timeline heights
                        classNames.flexRow,
                      )}
                      style={{ minWidth: spreadsheetCanvasWidth }}
                    >
                      <ResourceGroupSubrows // usually does NOT have bottom-line
                        colGroups={(printLayout as ResourcePrintLayout).colGroups}
                        colGroupStats={colGroupStats}
                        colWidths={colWidths}
                        colGrows={colGrows}
                      />
                      <ResourceSubrow // almost always has bottom-line
                        resource={resource}
                        resourceFields={(printLayout as ResourcePrintLayout).resourceFields}
                        indent={(printLayout as ResourcePrintLayout).indent}
                        hasChildren={(printLayout as ResourcePrintLayout).hasChildren}
                        isExpanded={(printLayout as ResourcePrintLayout).isExpanded}
                        colStartIndex={groupColCnt}
                        colSpecs={colSpecs}
                        colWidths={colWidths}
                        colGrows={colGrows}
                        borderStart={Boolean(groupColCnt)}
                        borderBottom={isNotLast}
                        indentWidth={props.indentWidth}
                        totalX // set width and flexgrow on this subrow
                      />
                    </div>
                  </div>
                  <div
                    className={joinArrayishClassNames(options.resourceColumnDividerClass)}
                  />
                  <div // serves as timeline viewport
                    className={joinClassNames(
                      classNames.flexCol,
                      classNames.crop,
                      classNames.liquid,
                    )}
                  >
                    <ResourceLane
                      {...splitProps[resource.id]}
                      className={joinClassNames(
                        classNames.rel,
                        classNames.grow, // height-grow
                      )}
                      resource={resource}
                      dateProfile={dateProfile}
                      tDateProfile={tDateProfile}
                      nowDate={nowDate}
                      todayRange={todayRange}
                      businessHours={resource.businessHours || fallbackBusinessHours}
                      width={timeCanvasWidth}
                      slotWidth={slotWidth}
                      insetInlineStart={-timeAreaOffset}
                      borderBottom={isNotLast}
                    />
                  </div>
                </div>
              )
            } else {
              const group = (printLayout as GroupRowPrintLayout).entity
              const groupKey = createGroupId(group)

              return (
                <div
                  key={groupKey}
                  role='row'
                  className={joinClassNames(
                    classNames.flexRow,
                    classNames.breakInsideAvoid,
                  )}
                >
                  <div
                    className={joinClassNames(
                      classNames.crop,
                      classNames.flexRow,
                    )}
                    style={{ width: props.spreadsheetWidth }}
                  >
                    <ResourceGroupHeaderSubrow
                      group={group}
                      isExpanded={(printLayout as GroupRowPrintLayout).isExpanded}
                      colSpan={props.colSpecs.length}
                      borderBottom={isNotLast}
                      indentWidth={props.indentWidth}
                    />
                  </div>
                  <div
                    className={joinArrayishClassNames(options.resourceColumnDividerClass)}
                  />
                  <div className={joinClassNames(
                    classNames.crop,
                    classNames.flexRow,
                    classNames.liquid,
                  )}>
                    <GroupLane
                      group={group}
                      borderBottom={isNotLast}
                    />
                  </div>
                </div>
              )
            }
          })}
        </div>
      </ViewContainer>
    )
  }
}

function createColGroupStats(
  currentLayout: ResourcePrintLayout,
  prevLayout: ResourcePrintLayout | GroupRowPrintLayout,
  nextLayout: ResourcePrintLayout | GroupRowPrintLayout,
): { render: boolean, borderBottom: boolean }[] {
  return currentLayout.colGroups.map((colGroup, colGroupI) => ({
    render: !prevLayout ||
      !(prevLayout as ResourcePrintLayout).colGroups ||
      (prevLayout as ResourcePrintLayout).colGroups[colGroupI] !== colGroup,
    borderBottom: nextLayout && (
      !(nextLayout as ResourcePrintLayout).colGroups ||
      (nextLayout as ResourcePrintLayout).colGroups[colGroupI] !== colGroup
    ),
  }))
}

function compileColWidths(
  colWidthConfigs: SiblingDimConfig[],
  colWidths: number[] | undefined,
): [
  flexDims: number[] | undefined,
  flexGrows: number[] | undefined,
  canvasMinWidth: CssDimValue | undefined,
] {
  if (colWidths != null) {
    return flexifyDimConfigs(colWidthConfigs, colWidths)
  }

  return [undefined, undefined, undefined]
}
