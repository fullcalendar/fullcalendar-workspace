import {
  BaseComponent,
  greatestDurationDenominator,
  isArraysEqual,
  useLatest,
  useMeasuredState,
  useNow,
  useReportedSize,
  useViewContext,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { useMemo, useRef, useState } from 'react'
import { buildResourceHierarchy, GenericNode, GroupNode, ResourceNode } from '../../resource/common/resource-hierarchy'
import { filterResourceStore } from '../../resource/common/resource-filtering'
import { ResourceSplitter } from '../../resource/common/ResourceSplitter'
import { ResourceViewProps } from '../../resource/View'
import { buildTimelineDateProfile } from '../../timeline/timeline-date-profile'
import { computeSlotWidth } from '../../timeline/timeline-positioning'
import { TimelineLaneSlicer } from '../../timeline/TimelineLaneSlicer'
import { DimConfig, parseDimConfig, pixelizeDimConfigs, resizeSiblingDimConfig, SiblingDimConfig } from '@full-ui/headless-grid'
import { EntityScroll, ResourceTimelineLayoutNormal, TimeScroll } from './ResourceTimelineLayoutNormal'
import { ResourceTimelineLayoutPrint } from './ResourceTimelineLayoutPrint'
import { processColOptions } from '../col-options'
import { ResourceExpander } from './spreadsheet/ResourceExpander'

const MIN_RESOURCE_AREA_WIDTH = 30 // definitely bigger than scrollbars

// a class, because a view's component must be one (see parseViewConfig)
export class ResourceTimelineView extends BaseComponent<ResourceViewProps> {
  render() {
    return <ResourceTimelineViewBody {...this.props} />
  }
}

function ResourceTimelineViewBody(props: ResourceViewProps) {
  const context = useViewContext()
  const { dateProfile } = props
  const { options } = context

  const [colWidthOverrides, setColWidthOverrides] = useState<SiblingDimConfig[] | undefined>(undefined)
  const [spreadsheetClientWidth, handleSpreadsheetClientWidth] = useMeasuredState() // pixel-width of scroll inner area
  const [timeClientWidth, handleTimeClientWidth] = useMeasuredState()
  const [slotInnerWidth, handleSlotInnerWidth] = useMeasuredState()
  const [expanderWidth, setExpanderWidth] = useState<number | undefined>(undefined)

  // kept here because print replaces the layout. see ResourceTimelineLayoutNormal
  const scrollRef = useRef<EntityScroll & TimeScroll | null>(null)
  const spreadsheetResizedWidthConfigRef = useRef<DimConfig | null>(null)

  /* date */

  const tDateProfile = useMemo(
    () => buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    ),
    [dateProfile, context.dateEnv, options, context.dateProfileGenerator],
  )
  const { unit: timerUnit, value: timeUnitValue } = greatestDurationDenominator(tDateProfile.slotDuration)
  const { nowDate, todayRange, nowMs } = useNow(timerUnit, timeUnitValue)

  /* table settings */

  const {
    groupSpecs,
    groupRowDepth,
    orderSpecs,
    colSpecs,
    groupColCnt,
    colWidthConfigs: initialColWidthConfigs,
    superHeaderRendering,
  } = useMemo(() => processColOptions(options), [options])

  const spreadsheetWidthConfig = spreadsheetResizedWidthConfigRef.current ??
    parseDimConfig(options.resourceColumnsWidth, MIN_RESOURCE_AREA_WIDTH)!

  /* spreadsheet col widths */

  const spreadsheetColWidthConfigs = colWidthOverrides || initialColWidthConfigs
  const [spreadsheetColWidths, spreadsheetCanvasWidth] = spreadsheetClientWidth != null
    ? pixelizeDimConfigs(spreadsheetColWidthConfigs, spreadsheetClientWidth)
    : [undefined, undefined]

  /* table hierarchy */

  const resourceStore = useMemo(
    () => filterResourceStore(
      props.resourceStore,
      options.filterResourcesWithEvents,
      props.rawEventStore,
      dateProfile.activeRange,
    ),
    [props.resourceStore, options.filterResourcesWithEvents, props.rawEventStore, dateProfile.activeRange],
  )
  const resourceHierarchy = useMemo(
    () => buildResourceHierarchy(
      resourceStore,
      orderSpecs,
      groupSpecs,
      groupRowDepth,
    ),
    [resourceStore, orderSpecs, groupSpecs, groupRowDepth],
  )
  const hasNesting = useMemo(() => computeHasNesting(resourceHierarchy), [resourceHierarchy])

  /* table positions */

  const [timeCanvasWidth, slotWidth, slotLiquid] = useMemo(
    () => computeSlotWidth(
      tDateProfile.slotCnt,
      tDateProfile.slotsPerLabel,
      options.slotMinWidth,
      slotInnerWidth, // is ACTUALLY the last-level label width. rename?
      timeClientWidth,
    ),
    [tDateProfile.slotCnt, tDateProfile.slotsPerLabel, options.slotMinWidth, slotInnerWidth, timeClientWidth],
  )

  /* event display */

  const [resourceSplitter] = useState(() => new ResourceSplitter())
  const [bgSlicer] = useState(() => new TimelineLaneSlicer())
  const splitProps = resourceSplitter.splitProps({ ...props, resourceStore })
  const bgLaneProps = splitProps['']
  const bgSlicedProps = bgSlicer.sliceProps(
    bgLaneProps,
    dateProfile,
    tDateProfile.isTimeScale ? null : options.nextDayThreshold,
    context, // wish we didn't need to pass in the rest of these args...
    dateProfile,
    context.dateProfileGenerator,
    tDateProfile,
    context.dateEnv,
  )

  /* business hour display */

  const hasResourceBusinessHours = useMemo(
    () => computeHasResourceBusinessHours(resourceHierarchy),
    [resourceHierarchy],
  )
  const fallbackBusinessHours = hasResourceBusinessHours ? props.businessHours : null

  /* handlers */

  const latestRef = useLatest({ spreadsheetColWidthConfigs, spreadsheetColWidths, spreadsheetClientWidth })
  const [handlers] = useState(() => ({
    handleColResize(colIndex: number, newWidth: number) {
      const { spreadsheetColWidthConfigs, spreadsheetColWidths, spreadsheetClientWidth } = latestRef.current
      const newOverrides = resizeSiblingDimConfig(
        spreadsheetColWidthConfigs,
        spreadsheetColWidths,
        spreadsheetClientWidth,
        colIndex,
        newWidth,
      )

      setColWidthOverrides((prev) => (prev && isArraysEqual(prev, newOverrides)) ? prev : newOverrides)
    },
  }))
  const handleExpanderEl = useReportedSize({
    watchWidth: true,
    onSize(width) {
      setExpanderWidth(width)
    },
  })

  const baseProps = {
    className: props.className,
    tDateProfile,
    dateProfile,
    resourceHierarchy,
    resourceEntityExpansions: props.resourceEntityExpansions,
    hasNesting,
    nowDate,
    nowMs,
    todayRange,
    colSpecs,
    groupColCnt,
    superHeaderRendering,
    splitProps,
    bgSlicedProps,
    slotWidth,
    timeCanvasWidth,
    spreadsheetColWidths,
  }

  return (
    <>
      {props.forPrint ? (
        <ResourceTimelineLayoutPrint
          {...baseProps}
          hasResourceBusinessHours={hasResourceBusinessHours}
          spreadsheetWidthConfig={spreadsheetWidthConfig}
          timeCanvasClipStart={scrollRef.current?.x ?? 0 /* for simulating horizontal scroll */}
          indentWidth={expanderWidth}
        />
      ) : (
        <ResourceTimelineLayoutNormal
          {...baseProps}
          labelId={props.labelId}
          labelStr={props.labelStr}
          eventSelection={props.eventSelection}
          hasResourceBusinessHours={hasResourceBusinessHours}
          fallbackBusinessHours={fallbackBusinessHours}
          slotLiquid={slotLiquid}
          timeClientWidthRef={handleTimeClientWidth}
          slotInnerWidthRef={handleSlotInnerWidth}
          initialSpreadsheetWidthConfig={spreadsheetWidthConfig}
          spreadsheetCanvasWidth={spreadsheetCanvasWidth}
          initialScroll={scrollRef.current /* for reviving after print-view */}

          // refs
          spreadsheetResizedWidthConfigRef={spreadsheetResizedWidthConfigRef}
          spreadsheetClientWidthRef={handleSpreadsheetClientWidth} // for pixel value
          scrollRef={scrollRef}

          // handlers
          onColResize={handlers.handleColResize}
          indentWidth={expanderWidth}
        />
      )}
      <ResourceExpander // for probing size
        isExpanded
        elRef={handleExpanderEl}
        className={classNames.offscreen}
      />
    </>
  )
}

function computeHasResourceBusinessHours(resourceHierarchy: GenericNode[]): boolean {
  for (const node of resourceHierarchy) {
    if (
      ((node as ResourceNode).resourceFields && (node as ResourceNode).entity.businessHours) ||
        computeHasResourceBusinessHours(node.children)
    ) {
      return true
    }
  }

  return false
}

function computeHasNesting(resourceHierarchy: GenericNode[]): boolean {
  for (const node of resourceHierarchy) {
    if (
      (node.children.length && !(node as GroupNode).pooledHeight) || // has children, but NOT a col-spanning group
        computeHasNesting(node.children)
    ) {
      return true
    }
  }

  return false
}
