import {
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  EventStore,
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
  TimelineLaneBg,
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

export interface ResourceTimelineLayoutPrintProps {
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

  slotWidth: number
  timeCanvasWidth: number
  spreadsheetColWidths: number[]
  spreadsheetCanvasWidth: number

  resourceAreaWidth: CssDimValue
  timeAreaOffset: number
}

const BG_HEIGHT = 100000

export class ResourceTimelineLayoutPrint extends BaseComponent<ResourceTimelineLayoutPrintProps> {
  // memoized
  private buildPrintLayouts = memoize(buildPrintLayouts)

  render() {
    let { props, context } = this
    let { dateProfile } = props
    let { options, viewSpec } = context

    const { tDateProfile, todayRange, nowDate } = props
    const { slotWidth, timeCanvasWidth, spreadsheetColWidths, spreadsheetCanvasWidth } = props
    const { hasResourceBusinessHours, fallbackBusinessHours } = props
    const { splitProps, bgSlicedProps } = props
    const { superHeaderRendering, groupColCnt, colSpecs } = props

    const { cellRows } = tDateProfile

    const { resourceHierarchy } = props
    const printLayouts = this.buildPrintLayouts(
      resourceHierarchy,
      props.hasNesting,
      props.resourceEntityExpansions,
      options.resourcesInitiallyExpanded,
    )

    const enableNowIndicator = // TODO: DRY
      options.nowIndicator &&
      slotWidth != null &&
      rangeContainsMarker(props.dateProfile.currentRange, nowDate)

    const timeInnerLeft = (context.isRtl ? 1 : -1) * props.timeAreaOffset

    return (
      <ViewContainer
        className='fc-resource-timeline fc-print-root fc-border'
        viewSpec={viewSpec}
      >
        <div className='fc-print-header fc-border-b'>
          <div className='fc-flex-row'>

            {/* DataGrid HEADER */}
            <div className='fc-flex-col' style={{ width: props.resourceAreaWidth }}>
              {Boolean(superHeaderRendering) && (
                <div role="row" className="fc-grow fc-flex-row fc-border-b">
                  <SuperHeaderCell
                    renderHooks={superHeaderRendering}
                    indent={props.hasNesting && !groupColCnt /* group-cols are leftmost, making expander alignment irrelevant */}
                  />
                </div>
              )}
              <div className='fc-crop fc-grow fc-flex-row'>
                <div className='fc-flex-row' style={{ width: spreadsheetCanvasWidth }}>
                  <HeaderRow
                    colSpecs={colSpecs}
                    colWidths={spreadsheetColWidths}
                    indent={props.hasNesting}
                  />
                </div>
              </div>
            </div>

            {/* Timeline HEADER */}
            <div className='fc-liquid fc-flex-row fc-crop fc-border-s'>
              <div
                // the canvas, origin for now-indicator
                className='fc-flex-col fc-rel'
                style={{
                  width: timeCanvasWidth,
                  left: timeInnerLeft,
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
        </div>{/* Header END */ }
        {/* Body START */}
        {/* Must crop 200% fill */}
        <div className='fc-rel fc-crop'>

          {/* BACKGROUND FILL */}
          {/* Must crop horizontally-offscreen slats and whatnot */}
          {/* TODO: more DRY */}
          <div
            className='fc-fill fc-border-s fc-border-transparent fc-crop'
            style={{
              // HACK for print where header-height prevents absolutely-positioned events
              // from falling short in height for subsequent pages
              height: BG_HEIGHT,

              // TODO: nicer way of doing this
              left: context.isRtl ? undefined : props.resourceAreaWidth,
              right: context.isRtl ? props.resourceAreaWidth : undefined,
            }}
          >
            <div
              className='fc-fill-y'
              style={{
                width: timeCanvasWidth,
                height: BG_HEIGHT, // HACK

                // TODO: nicer way of doing this
                left: context.isRtl ? undefined : timeInnerLeft,
                right: context.isRtl ? timeInnerLeft : undefined,
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
              <TimelineLaneBg
                tDateProfile={tDateProfile}
                nowDate={nowDate}
                todayRange={todayRange}

                // content
                bgEventSegs={bgSlicedProps.bgEventSegs}
                businessHourSegs={hasResourceBusinessHours ? null : bgSlicedProps.businessHourSegs}
                dateSelectionSegs={bgSlicedProps.dateSelectionSegs}
                // empty array will result in unnecessary rerenders?...
                eventResizeSegs={(bgSlicedProps.eventResize ? bgSlicedProps.eventResize.segs : [])}

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
          {printLayouts.map((printLayout, rowIndex) => {
            const isNotLast = rowIndex < printLayouts.length - 1

            if ((printLayout as ResourcePrintLayout).colGroups) {
              const resource = (printLayout as ResourcePrintLayout).entity
              const colGroupStats = createColGroupStats(
                printLayout as ResourcePrintLayout,
                printLayouts[rowIndex - 1],
                printLayouts[rowIndex + 1]
              )

              return (
                <div
                  key={resource.id}
                  className='fc-flex-row fc-break-inside-avoid'
                >
                  <div className='fc-crop fc-flex-row' style={{ width: props.resourceAreaWidth }}>
                    <div className='fc-flex-row' style={{ width: spreadsheetCanvasWidth }}>
                      <ResourceGroupCells
                        colGroups={(printLayout as ResourcePrintLayout).colGroups}
                        colGroupStats={colGroupStats}
                        colWidths={spreadsheetColWidths}
                      />
                      <ResourceCells
                        resource={resource}
                        resourceFields={(printLayout as ResourcePrintLayout).resourceFields}
                        indent={(printLayout as ResourcePrintLayout).indent}
                        hasChildren={(printLayout as ResourcePrintLayout).hasChildren}
                        isExpanded={(printLayout as ResourcePrintLayout).isExpanded}
                        colStartIndex={groupColCnt}
                        colSpecs={colSpecs}
                        colWidths={spreadsheetColWidths}
                        className={isNotLast ? 'fc-border-b' : ''}
                      />
                    </div>
                  </div>
                  <div
                    className={joinClassNames(
                      'fc-crop fc-liquid fc-flex-row fc-border-s',
                      isNotLast && 'fc-border-b',
                    )}
                  >
                    <div
                      className='fc-rel'
                      style={{
                        width: timeCanvasWidth,
                        left: timeInnerLeft
                      }}
                    >
                      <ResourceLane
                        {...splitProps[resource.id]}
                        resource={resource}
                        dateProfile={dateProfile}
                        tDateProfile={tDateProfile}
                        nowDate={nowDate}
                        todayRange={todayRange}
                        nextDayThreshold={context.options.nextDayThreshold}
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
                  className={joinClassNames(
                    'fc-flex-row fc-break-inside-avoid',
                    isNotLast && 'fc-border-b',
                  )}
                >
                  <div className='fc-crop fc-flex-row' style={{ width: props.resourceAreaWidth }}>
                    <GroupWideCell
                      group={group}
                      isExpanded={(printLayout as GroupRowPrintLayout).isExpanded}
                    />
                  </div>
                  <div className='fc-crop fc-flex-row fc-border-s fc-liquid'>
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
