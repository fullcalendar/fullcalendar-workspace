import {
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  EventStore,
  generateClassName,
  joinArrayishClassNames,
  joinClassNames,
  memoize,
  rangeContainsMarker,
  SlicedProps,
  SplittableProps,
  ViewContainer
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import {
  ColSpec,
  createGroupId,
  GenericNode,
  ResourceEntityExpansions
} from '@fullcalendar/resource/internal'
import {
  TimelineDateProfile,
  TimelineHeaderRow,
  TimelineBg,
  TimelineNowIndicatorArrow,
  TimelineNowIndicatorLine,
  TimelineRange,
  TimelineSlats
} from '@fullcalendar/timeline/internal'
import { buildPrintLayouts, GroupRowPrintLayout, ResourcePrintLayout } from '../resource-layout-print.js'
import { GroupLane } from './lane/GroupLane.js'
import { ResourceLane } from './lane/ResourceLane.js'
import { GroupWideCell } from './spreadsheet/GroupWideCell.js'
import { HeaderRow } from './spreadsheet/HeaderRow.js'
import { ResourceCells } from './spreadsheet/ResourceCells.js'
import { SuperHeaderCell } from './spreadsheet/SuperHeaderCell.js'
import { ResourceGroupCells } from './spreadsheet/ResourceGroupCells.js'
import { CssDimValue } from '@fullcalendar/core'
import { flexifyDimConfigs, SiblingDimConfig } from '../col-positioning.js'

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

  borderX: boolean
  borderTop: boolean
  borderBottom: boolean
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
        className={joinClassNames(
          'fc-print-root',
          props.className,
        )}
        borderX={props.borderX}
        borderTop={props.borderTop}
        borderBottom={props.borderBottom}
      >
        <div className={joinClassNames(
          'fc-print-header',
          generateClassName(options.viewHeaderClassNames, {
            borderX: props.borderX,
            isSticky: false,
          }),
        )}>
          <div className='fc-flex-row'>

            {/* DataGrid HEADER */}
            <div role='rowgroup' className='fc-flex-col' style={{ width: props.spreadsheetWidth }}>
              {Boolean(superHeaderRendering) && (
                <div
                  role='row'
                  className={joinArrayishClassNames(
                    'fc-row-bordered', // TODO: temporary
                    'fc-flex-row fc-grow fc-border-only-b',
                    options.resourceAreaHeaderRowClassNames,
                  )}
                >
                  <SuperHeaderCell
                    renderHooks={superHeaderRendering}
                    indent={hasNesting && !groupColCnt /* group-cols are leftmost, making expander alignment irrelevant */}
                    colSpan={colSpecs.length}
                  />
                </div>
              )}
              <div className='fc-flex-col fc-grow fc-crop'>
                <div className='fc-flex-col fc-grow' style={{ minWidth: spreadsheetCanvasWidth }}>
                  <HeaderRow
                    colSpecs={colSpecs}
                    colWidths={colWidths}
                    colGrows={colGrows}
                    indent={hasNesting}
                  />
                </div>
              </div>
            </div>

            <div
              className={joinArrayishClassNames(options.resourceAreaDividerClassNames)}
            />

            {/* Timeline HEADER */}
            <div className='fc-liquid fc-flex-row fc-crop'>
              <div // the canvas, origin for now-indicator
                className='fc-flex-col fc-rel'
                style={{
                  width: timeCanvasWidth,
                  // TODO: nicer way of doing this
                  left: context.isRtl ? undefined : -timeAreaOffset,
                  right: context.isRtl ? -timeAreaOffset : undefined,
                }}
              >
                {cellRows.map((cells, rowLevel) => {
                  const isLast = rowLevel === cellRows.length - 1
                  return (
                    <TimelineHeaderRow
                      key={rowLevel}
                      dateProfile={props.dateProfile}
                      tDateProfile={tDateProfile}
                      nowDate={nowDate}
                      todayRange={todayRange}
                      rowLevel={rowLevel}
                      isLastRow={isLast}
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
            className={joinArrayishClassNames(options.slotLabelDividerClassNames)}
          />
        </div>{/* Header END */ }
        {/* Body START */}
        {/* Must crop the 200% vertical-line fill */}
        <div
          role='rowgroup'
          className={joinClassNames(
            'fc-rel fc-crop',
            generateClassName(options.viewBodyClassNames, {
              borderX: props.borderX,
            }),
          )}
        >

          {/* BACKGROUND FILL */}
          {/* Must crop horizontally-offscreen slats and whatnot */}
          {/* TODO: more DRY */}
          <div
            aria-hidden
            className='fc-fill fc-crop'
            style={{
              // HACK for print where header-height prevents absolutely-positioned events
              // from falling short in height for subsequent pages
              height: BG_HEIGHT,

              // TODO: nicer way of doing this
              left: context.isRtl ? undefined : props.spreadsheetWidth,
              right: context.isRtl ? props.spreadsheetWidth : undefined,
              // TODO: add the divider width too!!!
            }}
          >
            <div
              className='fc-fill-y'
              style={{
                width: timeCanvasWidth,
                height: BG_HEIGHT, // HACK

                // TODO: nicer way of doing this
                left: context.isRtl ? undefined : -timeAreaOffset,
                right: context.isRtl ? -timeAreaOffset : undefined,
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
                  className='fc-flex-row fc-break-inside-avoid'
                >
                  {/*
                    TODO put options.resourceAreaRowClassNames on this sub-row-container element
                  */}
                  <div className='fc-flex-col fc-crop' style={{ width: props.spreadsheetWidth }}>
                    <div className='fc-flex-row fc-grow' style={{ minWidth: spreadsheetCanvasWidth }}>
                      {/*
                        instead of conditionally adding border via colGroupStats[].colGroupStats
                        use options.resourceAreaRowClassNames
                      */}
                      <ResourceGroupCells
                        colGroups={(printLayout as ResourcePrintLayout).colGroups}
                        colGroupStats={colGroupStats}
                        colWidths={colWidths}
                        colGrows={colGrows}
                      />
                      <ResourceCells
                        resource={resource}
                        resourceFields={(printLayout as ResourcePrintLayout).resourceFields}
                        indent={(printLayout as ResourcePrintLayout).indent}
                        hasChildren={(printLayout as ResourcePrintLayout).hasChildren}
                        isExpanded={(printLayout as ResourcePrintLayout).isExpanded}
                        colStartIndex={groupColCnt}
                        colSpecs={colSpecs}
                        colWidths={colWidths}
                        colGrows={colGrows}
                        className={joinArrayishClassNames(
                          'fc-row-bordered', // TODO: temporary
                          isNotLast ? 'fc-border-only-b' : 'fc-border-none',
                          options.resourceAreaRowClassNames,
                        )}
                      />
                    </div>
                  </div>
                  <div
                    className={joinArrayishClassNames(options.resourceAreaDividerClassNames)}
                  />
                  <div
                    className={joinClassNames(
                      'fc-flex-col fc-crop fc-liquid',
                      'fc-row-bordered', // TODO: temporary
                      isNotLast ? 'fc-border-only-b' : 'fc-border-none',
                    )}
                  >
                    <div
                      className='fc-rel'
                      style={{
                        width: timeCanvasWidth,

                        // TODO: nicer way of doing this
                        left: context.isRtl ? undefined : -timeAreaOffset,
                        right: context.isRtl ? -timeAreaOffset : undefined,
                      }}
                    >
                      <ResourceLane
                        {...splitProps[resource.id]}
                        resource={resource}
                        dateProfile={dateProfile}
                        tDateProfile={tDateProfile}
                        nowDate={nowDate}
                        todayRange={todayRange}
                        businessHours={resource.businessHours || fallbackBusinessHours}
                        slotWidth={slotWidth}
                      />
                    </div>
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
                    'fc-flex-row fc-break-inside-avoid',
                    'fc-row-bordered', // TODO: temporary
                    isNotLast ? 'fc-border-only-b' : 'fc-border-none',
                  )}
                >
                  <div className='fc-crop fc-flex-row' style={{ width: props.spreadsheetWidth }}>
                    <GroupWideCell
                      group={group}
                      isExpanded={(printLayout as GroupRowPrintLayout).isExpanded}
                      colSpan={props.colSpecs.length}
                    />
                  </div>
                  <div
                    className={joinArrayishClassNames(options.resourceAreaDividerClassNames)}
                  />
                  <div className='fc-crop fc-flex-row fc-liquid'>
                    <GroupLane group={group} />
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
