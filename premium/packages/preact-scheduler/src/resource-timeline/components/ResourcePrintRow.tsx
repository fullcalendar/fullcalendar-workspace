import { CssDimValue, joinClassNames } from '@fullcalendar/preact/public-api'
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

/** Renders one logical resource row whose Timeline bands can fragment across print pages. */
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
        className={classNames.flexRow}
      >
        <div
          className={joinClassNames(classNames.flexCol, classNames.crop)}
          style={{ width: props.spreadsheetWidth }}
        >
          <div
            className={joinClassNames(classNames.grow, classNames.flexRow)}
            style={{ minWidth: props.spreadsheetCanvasWidth }}
          >
            <ResourceGroupSubrows
              colGroups={layout.colGroups}
              colGroupStats={props.colGroupStats}
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
              borderBottom={props.isNotLast}
              indentWidth={props.indentWidth}
              totalX
            />
          </div>
        </div>

        <div className={joinClassNames(options.resourceColumnDividerClass)} />

        <div className={joinClassNames(classNames.flexCol, classNames.crop, classNames.liquid)}>
          <div
            className={joinClassNames(classNames.flexCol, classNames.rel, classNames.grow)}
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
                classNames.grow,
                classNames.noMargin,
                classNames.noPadding,
                classNames.flexCol,
                classNames.contentBox,
                props.isNotLast ? classNames.borderOnlyB : classNames.borderNone,
                classNames.rel,
              )}
              renderProps={renderProps}
              generatorName={undefined}
              didMount={options.resourceLaneDidMount}
              willUnmount={options.resourceLaneWillUnmount}
            >
              {() => (
                <>
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
                  <ContentContainer
                    tag='div'
                    className={joinClassNames(classNames.noMargin, classNames.noShrink)}
                    renderProps={renderProps}
                    generatorName='resourceLaneTopContent'
                    customGenerator={options.resourceLaneTopContent}
                    classNameGenerator={options.resourceLaneTopClass}
                  />
                  {eventBands.map((band) => (
                    <TimelinePrintEventBand
                      {...timelineBandProps}
                      key={band.levelIndex}
                      band={band}
                      heightRefMap={this.printHeights.segHeightRefMap}
                    />
                  ))}
                  {moreLinkBand && (
                    <TimelinePrintMoreLinkBand
                      {...timelineBandProps}
                      band={moreLinkBand}
                      heightRefMap={this.printHeights.moreLinkHeightRefMap}
                    />
                  )}
                  <ContentContainer
                    tag='div'
                    className={joinClassNames(classNames.noMargin, classNames.noShrink)}
                    renderProps={renderProps}
                    generatorName='resourceLaneBottomContent'
                    customGenerator={options.resourceLaneBottomContent}
                    classNameGenerator={options.resourceLaneBottomClass}
                  />
                </>
              )}
            </ContentContainer>
          </div>
        </div>
      </div>
    )
  }
}
