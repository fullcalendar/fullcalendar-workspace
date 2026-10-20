import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  CustomContent,
  DateMarker,
  DateProfile,
  DateRange,
  generateClassName,
  memoize,
  memoizeObjArg,
  SplittableProps,
  useRenderHookEl,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import { type ReactNode } from 'react'
import classNames from '@fullcalendar/preact/protected-styles'
import { TimelineBg } from '../../timeline/components/TimelineBg'
import {
  TimelinePrintEventBand,
  TimelinePrintMoreLinkBand,
} from '../../timeline/components/TimelinePrintFg'
import { TimelinePrintRenderer } from '../../timeline/print-adapter'
import { TimelineDateProfile } from '../../timeline/timeline-date-profile'
import { TimelineLaneSlicer } from '../../timeline/TimelineLaneSlicer'
import { getPublicId } from '../../resource/structs/resource'
import { ResourcePrintTableRow } from '../resource-layout-print'
import { ColSpec } from '../structs'
import {
  buildResourceDateSpanProps,
  buildResourceEventRenderProps,
  refineResourceLaneRenderProps,
} from './lane/ResourceLane'
import { ResourceCell } from './spreadsheet/ResourceCell'
import { ResourceGroupCell } from './spreadsheet/ResourceGroupCell'

export interface ResourcePrintRowProps extends SplittableProps {
  layout: ResourcePrintTableRow
  rowIndex: number
  rowCount: number
  isNotLast: boolean

  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange

  colSpecs: ColSpec[]
  groupColCnt: number
  timeCanvasClipStart: number
  slotWidth: number | undefined
  indentWidth: number | undefined
}

/** Renders one logical resource row whose Timeline bands can fragment across print pages. */
export class ResourcePrintRow extends TimelinePrintRenderer<ResourcePrintRowProps> {
  // memo
  private refineRenderProps = memoizeObjArg(refineResourceLaneRenderProps)
  private buildDateSpanProps = memoize(buildResourceDateSpanProps)
  private buildEventRenderProps = memoize(buildResourceEventRenderProps)

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
    const eventRenderProps = this.buildEventRenderProps(renderProps.resource)
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
      dateSpanProps: this.buildDateSpanProps(resource.id),
      renderProps: eventRenderProps,
      timeCanvasClipStart: props.timeCanvasClipStart,
    }

    return (
      <tr>
        {layout.colGroupCells.map((cell, colIndex) => cell && (
          <ResourceGroupCell
            key={colIndex}
            colSpec={cell.group.spec}
            fieldValue={cell.group.value}
            rowSpan={cell.rowSpan}
            borderStart={Boolean(colIndex)}
            borderBottom={props.rowIndex + cell.rowSpan < props.rowCount}
            forPrint
          />
        ))}
        {props.colSpecs.slice(props.groupColCnt).map((colSpec, colIndex0) => {
          const colIndex = props.groupColCnt + colIndex0
          const fieldValue = colSpec.field
            ? layout.resourceFields[colSpec.field]
            : (resource.title || getPublicId(resource.id))

          return (
            <ResourceCell
              key={colIndex}
              colSpec={colSpec}
              resource={resource}
              field={colSpec.field || 'title'}
              fieldValue={fieldValue}
              indent={layout.indent}
              hasChildren={layout.hasChildren}
              isExpanded={layout.isExpanded}
              width={undefined}
              indentWidth={props.indentWidth}
              borderStart={Boolean(colIndex)}
              borderBottom={props.isNotLast}
              forPrint
            />
          )
        })}

        <td
          className={joinClassNames(options.resourceColumnDividerClass)}
        />

        <ResourcePrintLaneCell
          resourceId={resource.id}
          className={joinClassNames(
            resourceLaneClassName,
            options.resourceRowClass,
            classNames.noMargin,
            classNames.noPadding,
            classNames.contentBox,
            classNames.borderlessX,
            classNames.borderlessTop,
            !props.isNotLast && classNames.borderlessBottom,
          )}
          renderProps={renderProps}
        >
          <div className={classNames.rel}>
            <div className={joinClassNames(classNames.fill, classNames.crop)}>
              <TimelineBg
                tDateProfile={props.tDateProfile}
                nowDate={props.nowDate}
                nowMs={props.nowMs}
                todayRange={props.todayRange}
                bgEventSegs={slicedProps.bgEventSegs}
                businessHourSegs={slicedProps.businessHourSegs}
                dateSelectionSegs={null}
                eventResizeSegs={null}
                renderProps={eventRenderProps}
                slotWidth={props.slotWidth}
                clipStart={props.timeCanvasClipStart}
              />
            </div>
            <CustomContent
              tag="div"
              className={joinClassNames(
                classNames.noMargin,
                classNames.noShrink,
                generateClassName(options.resourceLaneTopClass, renderProps),
              )}
              renderProps={renderProps}
              generatorName="resourceLaneTopContent"
              generator={options.resourceLaneTopContent}
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
            <CustomContent
              tag="div"
              className={joinClassNames(
                classNames.noMargin,
                classNames.noShrink,
                generateClassName(options.resourceLaneBottomClass, renderProps),
              )}
              renderProps={renderProps}
              generatorName="resourceLaneBottomContent"
              generator={options.resourceLaneBottomContent}
            />
          </div>
        </ResourcePrintLaneCell>
      </tr>
    )
  }
}

interface ResourcePrintLaneCellProps {
  resourceId: string
  className: string
  renderProps: ReturnType<typeof refineResourceLaneRenderProps>
  children: ReactNode
}

// the lane's cell, with its resourceLane* mount hooks. its class is generated by the row
function ResourcePrintLaneCell({ resourceId, className, renderProps, children }: ResourcePrintLaneCellProps) {
  const { options } = useViewContext()
  const renderHookEl = useRenderHookEl({
    classGenerator: undefined,
    didMount: options.resourceLaneDidMount,
    willUnmount: options.resourceLaneWillUnmount,
    renderProps,
  })

  return (
    <td
      data-resource-id={resourceId}
      ref={renderHookEl.ref}
      className={joinClassNames(renderHookEl.className, className)}
    >{children}</td>
  )
}
