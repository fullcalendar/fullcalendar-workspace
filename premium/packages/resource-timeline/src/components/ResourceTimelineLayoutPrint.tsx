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
import { computeHasNesting } from '../resource-layout.js'
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

export class ResourceTimelineLayoutPrint extends BaseComponent<ResourceTimelineLayoutPrintProps> {
  // memoized
  private computeHasNesting = memoize(computeHasNesting)
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
    const hasNesting = this.computeHasNesting(resourceHierarchy)
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

    const timeInnerLeft = (context.isRtl ? 1 : -1) * props.timeAreaOffset

    return (
      <ViewContainer
        className='fc-resource-timeline fc-flex-col fc-border fc-print-root'
        viewSpec={viewSpec}
      >
        <div className='fc-print-header'>
          <div className='fc-flex-row'>

            {/* DataGrid HEADER */}
            <div className='fc-flex-col' style={{ width: props.resourceAreaWidth }}>
              {Boolean(superHeaderRendering) && (
                <div role="row" className="fc-grow fc-flex-row fc-border-b">
                  <SuperHeaderCell
                    renderHooks={superHeaderRendering}
                    indent={hasNesting && !groupColCnt /* group-cols are leftmost, making expander alignment irrelevant */}
                  />
                </div>
              )}
              <div className='fc-crop'>
                <div className='fc-grow' style={{ width: spreadsheetCanvasWidth }}>
                  <HeaderRow
                    colSpecs={colSpecs}
                    colWidths={spreadsheetColWidths}
                    indent={hasNesting}
                  />
                </div>
              </div>
            </div>

            {/* Timeline HEADER */}
            <div className='fc-liquid fc-flex-row fc-crop'>
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
        <div className='fc-rel'>{/* Body START */}

          {/* BACKGROUND FILL */}
          {/* TODO: more DRY */}
          <div
            className='fc-fill'
            style={{
              // TODO: nicer way of doing this
              left: context.isRtl ? undefined : props.resourceAreaWidth,
              right: context.isRtl ? props.resourceAreaWidth : undefined,
            }}
          >
            <TimelineSlats
              dateProfile={dateProfile}
              tDateProfile={tDateProfile}
              nowDate={nowDate}
              todayRange={todayRange}

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

          {/* BODY ROWS */}
          {printLayouts.map((printLayout, rowIndex) => {
            if ((printLayout as ResourcePrintLayout).colGroups) {
              const resource = (printLayout as ResourcePrintLayout).entity

              return (
                <div
                  key={resource.id}
                  className={joinClassNames(
                    'fc-resource fc-flex-row',
                    rowIndex && 'fc-border-t'
                  )}
                >
                  <div className='fc-crop' style={{ width: props.resourceAreaWidth }}>
                    <div className='fc-flex-row' style={{ width: spreadsheetCanvasWidth }}>
                      <ResourceGroupCells
                        colGroups={(printLayout as ResourcePrintLayout).colGroups}
                        colGroupIndexes={(printLayout as ResourcePrintLayout).colGroupIndexes}
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
                      />
                    </div>
                  </div>
                  <div className='fc-crop fc-liquid'>
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
                    // TODO: add fc-resource-group className?
                    'fc-flex-row',
                    rowIndex && 'fc-border-t'
                  )}
                >
                  <div className='fc-crop' style={{ width: props.resourceAreaWidth }}>
                    <GroupWideCell
                      group={group}
                      isExpanded={(printLayout as GroupRowPrintLayout).isExpanded}
                    />
                  </div>
                  <div className='fc-crop fc-liquid'>
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
