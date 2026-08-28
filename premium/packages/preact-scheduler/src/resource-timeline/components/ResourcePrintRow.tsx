import { type ClassNameInput, CssDimValue, joinClassNames } from '@fullcalendar/preact/public-api'
import {
  ContentContainer,
  DateMarker,
  DateProfile,
  DateRange,
  generateClassName,
  memoizeObjArg,
  SplittableProps,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode } from 'react'
import { TimelineBg } from '../../timeline/components/TimelineBg'
import {
  TimelinePrintEventBand,
  TimelinePrintMoreLinkBand,
} from '../../timeline/components/TimelinePrintFg'
import { TimelinePrintRenderer } from '../../timeline/print-adapter'
import { TimelineDateProfile } from '../../timeline/timeline-date-profile'
import { TimelineLaneSlicer } from '../../timeline/TimelineLaneSlicer'
import { type AriaCellInput, buildAriaCellAttrs } from '../aria'
import { ResourcePrintLayout } from '../resource-layout-print'
import { ColSpec } from '../structs'
import { refineResourceLaneRenderProps } from './lane/ResourceLane'
import { ResourceGroupSubrows } from './spreadsheet/ResourceGroupSubrows'
import { ResourceSubrow } from './spreadsheet/ResourceSubrow'

interface ColGroupStats {
  render: boolean
  borderBottom: boolean
}

export interface ResourcePrintRowProps extends SplittableProps, AriaCellInput {
  layout: ResourcePrintLayout
  colGroupStats: ColGroupStats[]
  hasNesting: boolean
  isNotLast: boolean

  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange

  colSpecs: ColSpec[]
  groupColCnt: number
  colWidths: number[] | undefined
  colGrows: number[] | undefined
  spreadsheetCanvasWidth: CssDimValue | undefined
  spreadsheetWidth: CssDimValue
  timeCanvasWidth: number | undefined
  timeAreaOffset: number
  slotWidth: number | undefined
  indentWidth: number | undefined
}

/** Renders one logical resource row as independently breakable synchronized sections. */
export class ResourcePrintRow extends TimelinePrintRenderer<ResourcePrintRowProps> {
  // memo
  private refineRenderProps = memoizeObjArg(refineResourceLaneRenderProps)

  // internal
  private slicer = new TimelineLaneSlicer()

  render() {
    const { props, context } = this
    const { options } = context
    const { layout } = props
    const { entity: resource } = layout
    const renderProps = this.refineRenderProps({
      resource,
      context,
      eventOverlap: Boolean(options.eventOverlap),
    })
    // Generate this render hook once. Its CSS tokens are also reused by the
    // trailing section solely to draw the lane's real row-bottom border.
    const resourceLaneClassName = generateClassName(options.resourceLaneClass, renderProps)

    const slicedProps = this.slicer.sliceProps(
      props,
      props.dateProfile,
      props.tDateProfile.isTimeScale ? null : options.nextDayThreshold,
      context,
      props.dateProfile,
      context.dateProfileGenerator,
      props.tDateProfile,
      context.dateEnv,
    )
    const { eventBands, moreLinkBand } = this.buildPrintBands(
      slicedProps.fgEventSegs,
      props.tDateProfile,
      props.slotWidth,
    )
    const leadingColGroupStats = props.colGroupStats.map((stats) => ({
      ...stats,
      borderBottom: false,
    }))

    const sectionFrameProps = {
      spreadsheetWidth: props.spreadsheetWidth,
      dividerClassName: options.resourceColumnDividerClass,
    }
    const placeholderProps = {
      layout,
      colGroupStats: props.colGroupStats,
      colSpecs: props.colSpecs,
      groupColCnt: props.groupColCnt,
      colWidths: props.colWidths,
      colGrows: props.colGrows,
      spreadsheetCanvasWidth: props.spreadsheetCanvasWidth,
      resourceRowClassName: options.resourceRowClass,
      resourceBorderBottom: false,
      drawBottomBorders: false,
    }
    const timelineBandProps = {
      dateProfile: props.dateProfile,
      tDateProfile: props.tDateProfile,
      nowDate: props.nowDate,
      nowMs: props.nowMs,
      todayRange: props.todayRange,
      eventSelection: slicedProps.eventSelection,
      resourceId: resource.id,
    }

    return (
      <div
        role='row'
        aria-level={props.hasNesting ? layout.indent : undefined}
        aria-expanded={layout.hasChildren ? layout.isExpanded : undefined}
        className={classNames.rel}
      >
        <div
          aria-hidden
          className={joinClassNames(classNames.fill, classNames.flexRow, classNames.z0)}
          style={{ height: '100%' }}
        >
          <div
            className={classNames.noShrink}
            style={{ width: props.spreadsheetWidth }}
          />
          <div
            className={joinClassNames(
              options.resourceColumnDividerClass,
              classNames.invisible,
            )}
          />
          <div className={joinClassNames(classNames.liquidX, classNames.crop, classNames.rel)}>
            <div
              className={classNames.fillY}
              style={{
                width: props.timeCanvasWidth,
                height: '100%',
                insetInlineStart: -props.timeAreaOffset,
              }}
            >
              <TimelineBg
                tDateProfile={props.tDateProfile}
                nowDate={props.nowDate}
                nowMs={props.nowMs}
                todayRange={props.todayRange}
                bgEventSegs={slicedProps.bgEventSegs}
                businessHourSegs={null}
                dateSelectionSegs={null}
                eventResizeSegs={null}
                slotWidth={props.slotWidth}
              />
            </div>
          </div>
        </div>

        <ResourcePrintSection
          {...sectionFrameProps}
          key='leading'
          spreadsheetContent={(
            <div
              className={joinClassNames(classNames.grow, classNames.flexRow)}
              style={{ minWidth: props.spreadsheetCanvasWidth }}
            >
              <ResourceGroupSubrows
                colGroups={layout.colGroups}
                colGroupStats={leadingColGroupStats}
                colWidths={props.colWidths}
                colGrows={props.colGrows}
              />
              <ResourceSubrow
                resource={resource}
                resourceFields={layout.resourceFields}
                indent={layout.indent}
                hasChildren={layout.hasChildren}
                isExpanded={layout.isExpanded}
                colStartIndex={props.groupColCnt}
                colSpecs={props.colSpecs}
                colWidths={props.colWidths}
                colGrows={props.colGrows}
                borderStart={Boolean(props.groupColCnt)}
                borderBottom={false}
                indentWidth={props.indentWidth}
                totalX
              />
            </div>
          )}
          timelineContent={(
            <div
              className={joinClassNames(classNames.flexRow, classNames.rel, classNames.grow)}
              style={{
                width: props.timeCanvasWidth,
                insetInlineStart: -props.timeAreaOffset,
              }}
            >
              <ContentContainer
                tag='div'
                attrs={{
                  ...buildAriaCellAttrs(props),
                  role: 'gridcell',
                  'data-resource-id': resource.id,
                }}
                className={joinClassNames(
                  resourceLaneClassName,
                  classNames.liquid,
                  classNames.noMargin,
                  classNames.noPadding,
                  classNames.flexCol,
                  classNames.contentBox,
                  classNames.borderNone,
                  classNames.rel,
                )}
                renderProps={renderProps}
                generatorName={undefined}
                didMount={options.resourceLaneDidMount}
                willUnmount={options.resourceLaneWillUnmount}
              >
                {() => (
                  <ContentContainer
                    tag='div'
                    className={joinClassNames(classNames.noMargin, classNames.noShrink)}
                    renderProps={renderProps}
                    generatorName='resourceLaneTopContent'
                    customGenerator={options.resourceLaneTopContent}
                    classNameGenerator={options.resourceLaneTopClass}
                  />
                )}
              </ContentContainer>
            </div>
          )}
        />

        {eventBands.map((band) => (
          <ResourcePrintSection
            {...sectionFrameProps}
            key={`event-${band.levelIndex}`}
            spreadsheetContent={<SpreadsheetPlaceholderCells {...placeholderProps} />}
            timelineContent={(
              <div
                className={joinClassNames(classNames.flexCol, classNames.rel)}
                style={{
                  width: props.timeCanvasWidth,
                  insetInlineStart: -props.timeAreaOffset,
                }}
              >
                <TimelinePrintEventBand
                  {...timelineBandProps}
                  band={band}
                  heightRefMap={this.printHeights.segHeightRefMap}
                />
              </div>
            )}
          />
        ))}

        {moreLinkBand && (
          <ResourcePrintSection
            {...sectionFrameProps}
            key='more-link'
            spreadsheetContent={<SpreadsheetPlaceholderCells {...placeholderProps} />}
            timelineContent={(
              <div
                className={joinClassNames(classNames.flexCol, classNames.rel)}
                style={{
                  width: props.timeCanvasWidth,
                  insetInlineStart: -props.timeAreaOffset,
                }}
              >
                <TimelinePrintMoreLinkBand
                  {...timelineBandProps}
                  band={moreLinkBand}
                  heightRefMap={this.printHeights.moreLinkHeightRefMap}
                />
              </div>
            )}
          />
        )}

        <ResourcePrintSection
          {...sectionFrameProps}
          key='trailing'
          spreadsheetContent={(
            <SpreadsheetPlaceholderCells
              {...placeholderProps}
              resourceBorderBottom={props.isNotLast}
              drawBottomBorders
            />
          )}
          timelineContent={(
            <div
              className={joinClassNames(classNames.flexCol, classNames.rel)}
              style={{
                width: props.timeCanvasWidth,
                insetInlineStart: -props.timeAreaOffset,
              }}
            >
              <ContentContainer
                tag='div'
                className={joinClassNames(
                  resourceLaneClassName,
                  classNames.noMargin,
                  classNames.noPadding,
                  classNames.noShrink,
                  classNames.contentBox,
                  props.isNotLast ? classNames.borderOnlyB : classNames.borderNone,
                )}
                renderProps={renderProps}
                generatorName='resourceLaneBottomContent'
                customGenerator={options.resourceLaneBottomContent}
                classNameGenerator={options.resourceLaneBottomClass}
              />
            </div>
          )}
        />
      </div>
    )
  }
}

interface ResourcePrintSectionProps {
  spreadsheetWidth: CssDimValue
  dividerClassName: ClassNameInput
  spreadsheetContent: ReactNode
  timelineContent: ReactNode
}

/** Keeps one spreadsheet continuation and its Timeline band in one print fragment. */
function ResourcePrintSection(props: ResourcePrintSectionProps) {
  return (
    <div className={joinClassNames(
      classNames.flexRow,
      classNames.breakInsideAvoid,
      classNames.rel,
      classNames.z1,
    )}>
      <div
        className={joinClassNames(classNames.flexCol, classNames.crop)}
        style={{ width: props.spreadsheetWidth }}
      >
        {props.spreadsheetContent}
      </div>
      <div className={joinClassNames(props.dividerClassName)} />
      <div className={joinClassNames(classNames.flexCol, classNames.crop, classNames.liquid)}>
        {props.timelineContent}
      </div>
    </div>
  )
}

interface SpreadsheetPlaceholderCellsProps {
  layout: ResourcePrintLayout
  colGroupStats: ColGroupStats[]
  colSpecs: ColSpec[]
  groupColCnt: number
  colWidths: number[] | undefined
  colGrows: number[] | undefined
  spreadsheetCanvasWidth: CssDimValue | undefined
  resourceRowClassName: ClassNameInput
  resourceBorderBottom: boolean
  drawBottomBorders: boolean
}

/** Draws continuation borders without repeating spreadsheet content or cell semantics. */
function SpreadsheetPlaceholderCells(props: SpreadsheetPlaceholderCellsProps) {
  const colWidths = props.colWidths || []
  const colGrows = props.colGrows || []
  let resourceWidth: number | undefined
  let resourceGrow: number | undefined

  if (props.colWidths) {
    resourceWidth = totalColDims(props.colWidths, props.groupColCnt, props.colSpecs.length)
  }
  if (props.colGrows) {
    resourceGrow = totalColDims(props.colGrows, props.groupColCnt, props.colSpecs.length)
  }

  return (
    <div
      aria-hidden
      className={joinClassNames(classNames.grow, classNames.flexRow)}
      style={{ minWidth: props.spreadsheetCanvasWidth }}
    >
      {props.layout.colGroups.map((_colGroup, colIndex) => {
        const drawBottomBorder = props.drawBottomBorders &&
          props.colGroupStats[colIndex].borderBottom

        return (
          <div
            key={colIndex} // eslint-disable-line react/no-array-index-key
            className={joinClassNames(
              props.resourceRowClassName,
              classNames.flexRow,
              drawBottomBorder ? classNames.borderOnlyB : classNames.borderNone,
            )}
            style={{
              minWidth: 0,
              width: colWidths[colIndex],
              flexGrow: colGrows[colIndex],
            }}
          >
            {/* A merged-group continuation row has no inner group cell, so its
            sections must not draw one either */}
            {props.colGroupStats[colIndex].render && (
              <div className={joinClassNames(
                props.resourceRowClassName,
                classNames.noMargin,
                classNames.noPadding,
                classNames.flexCol,
                classNames.liquid,
                colIndex ? classNames.borderOnlyS : classNames.borderNone,
              )} />
            )}
          </div>
        )
      })}
      <div
        className={joinClassNames(
          props.resourceRowClassName,
          classNames.flexRow,
          props.resourceBorderBottom ? classNames.borderOnlyB : classNames.borderNone,
        )}
        style={{
          width: resourceWidth,
          flexGrow: resourceGrow,
        }}
      >
        {mapRange(props.groupColCnt, props.colSpecs.length, (colIndex) => (
          <div
            key={colIndex} // eslint-disable-line react/no-array-index-key
            className={joinClassNames(
              props.resourceRowClassName,
              classNames.noMargin,
              classNames.noPadding,
              classNames.flexCol,
              classNames.alignStart,
              (props.groupColCnt || colIndex) ? classNames.borderOnlyS : classNames.borderNone,
              classNames.crop,
            )}
            style={{
              minWidth: 0,
              width: colWidths[colIndex],
              flexGrow: colGrows[colIndex],
            }}
          />
        ))}
      </div>
    </div>
  )
}

function mapRange<Item>(start: number, end: number, func: (index: number) => Item): Item[] {
  const items: Item[] = []

  for (let i = start; i < end; i++) {
    items.push(func(i))
  }

  return items
}

function totalColDims(colDims: number[], startIndex: number, endIndex: number): number {
  let total = 0

  for (let i = startIndex; i < endIndex; i++) {
    total += colDims[i]
  }

  return total
}
