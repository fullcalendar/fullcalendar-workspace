import {
  DateComponent,
  DateMarker,
  DateRange,
  greatestDurationDenominator,
  isArraysEqual,
  memoize,
  NowTimer} from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import {
  buildResourceHierarchy,
  GenericNode,
  GroupNode,
  ResourceNode,
  ResourceSplitter,
  ResourceViewProps
} from '@fullcalendar/resource/internal'
import {
  buildTimelineDateProfile,
  computeSlotWidth,
  TimelineLaneSlicer
} from '@fullcalendar/timeline/internal'
import {
  processSpreadsheetColWidthConfigs,
  processSpreadsheetColWidthOverrides
} from '../col-positioning.js'
import { EntityScroll, ResourceTimelineLayoutNormal, TimeScroll } from './ResourceTimelineLayoutNormal.js'
import { ResourceTimelineLayoutPrint } from './ResourceTimelineLayoutPrint.js'
import { processColOptions } from '../col-options.js'
import { CssDimValue } from '@fullcalendar/core'

interface ResourceTimelineViewState {
  spreadsheetColWidthOverrides?: number[]
  spreadsheetClientWidth?: number
  slotInnerWidth?: number
  timeClientWidth?: number
}

export class ResourceTimelineView extends DateComponent<ResourceViewProps, ResourceTimelineViewState> {
  // memoized
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private processColOptions = memoize(processColOptions)
  private buildResourceHierarchy = memoize(buildResourceHierarchy)
  private computeSlotWidth = memoize(computeSlotWidth)
  private computeHasNesting = memoize(computeHasNesting)
  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)

  // ref
  private scrollRef = createRef<EntityScroll & TimeScroll>()
  private resourceAreaWidthRef = createRef<CssDimValue>()

  // internal
  private resourceSplitter = new ResourceSplitter()
  private bgSlicer = new TimelineLaneSlicer()

  render() {
    let { props, state, context } = this
    let { dateProfile } = props
    let { options } = context

    /* date */

    let tDateProfile = this.buildTimelineDateProfile(
      dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )
    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    /* table settings */

    let {
      groupSpecs,
      groupRowDepth,
      orderSpecs,
      colSpecs,
      groupColCnt,
      colWidthConfigs: initialColWidthConfigs,
      superHeaderRendering,
    } = this.processColOptions(context.options)

    /* table hierarchy */

    let resourceHierarchy = this.buildResourceHierarchy(
      props.resourceStore,
      orderSpecs,
      groupSpecs,
      groupRowDepth,
    )
    let hasNesting = this.computeHasNesting(resourceHierarchy)

    /* table positions */

    let [timeCanvasWidth, slotWidth] = this.computeSlotWidth(
      tDateProfile.slotCnt,
      tDateProfile.slotsPerLabel,
      options.slotMinWidth,
      state.slotInnerWidth, // is ACTUALLY the last-level label width. rename?
      state.timeClientWidth
    )

    let [spreadsheetColWidths, spreadsheetCanvasWidth] =
      state.spreadsheetColWidthOverrides
        ? processSpreadsheetColWidthOverrides(state.spreadsheetColWidthOverrides, state.spreadsheetClientWidth)
        : processSpreadsheetColWidthConfigs(initialColWidthConfigs, state.spreadsheetClientWidth)

    /* event display */

    let splitProps = this.resourceSplitter.splitProps(props)
    let bgLaneProps = splitProps['']
    let bgSlicedProps = this.bgSlicer.sliceProps(
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

    let hasResourceBusinessHours = this.computeHasResourceBusinessHours(resourceHierarchy)
    let fallbackBusinessHours = hasResourceBusinessHours ? props.businessHours : null

    return (
      <NowTimer unit={timerUnit}>
        {(nowDate: DateMarker, todayRange: DateRange) => {
          const baseProps = {
            tDateProfile,
            dateProfile,
            resourceHierarchy,
            resourceEntityExpansions: props.resourceEntityExpansions,
            hasNesting,
            nowDate,
            todayRange,
            colSpecs,
            groupColCnt,
            superHeaderRendering,
            splitProps,
            bgSlicedProps,
            hasResourceBusinessHours,
            fallbackBusinessHours,
            slotWidth,
            timeCanvasWidth,
            spreadsheetColWidths,
            spreadsheetCanvasWidth
          }

          return props.forPrint ? (
            <ResourceTimelineLayoutPrint
              {...baseProps}
              resourceAreaWidth={this.resourceAreaWidthRef.current}
              timeAreaOffset={this.scrollRef.current.x /* for simulating horizontal scroll */}
            />
          ) : (
            <ResourceTimelineLayoutNormal
              {...baseProps}
              timeClientWidthRef={this.handleTimeClientWidth}
              onSpreadsheetColWidthOverrides={this.handleSpreadsheetColWidthOverrides}
              spreadsheetClientWidthRef={this.handleSpreadsheetClientWidth}
              slotInnerWidthRef={this.handleSlotInnerWidth}
              initialResourceAreaWidth={
                this.resourceAreaWidthRef.current ?? // try save-state first
                  options.resourceAreaWidth
              }
              resourceAreaWidthRef={this.resourceAreaWidthRef}
              scrollRef={this.scrollRef}
              initialScroll={this.scrollRef.current /* for reviving after print-view */}
            />
          )
        }}
      </NowTimer>
    )
  }

  handleSpreadsheetColWidthOverrides = (spreadsheetColWidthOverrides: number[]) => {
    this.setState({ spreadsheetColWidthOverrides })
  }

  handleSpreadsheetClientWidth = (spreadsheetClientWidth: number | null) => {
    if (spreadsheetClientWidth != null) {
      this.setState({ spreadsheetClientWidth })
    }
  }

  handleSlotInnerWidth = (slotInnerWidth: number | null) => {
    if (slotInnerWidth != null) {
      this.setState({ slotInnerWidth })
    }
  }

  handleTimeClientWidth = (timeClientWidth: number | null) => {
    if (timeClientWidth != null) {
      this.setState({ timeClientWidth })
    }
  }
}

ResourceTimelineView.addStateEquality({
  spreadsheetColWidthOverrides: isArraysEqual,
})

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
