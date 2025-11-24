import {
  DateComponent,
  DateMarker,
  DateRange,
  greatestDurationDenominator,
  isArraysEqual,
  memoize,
  NowTimer,
  watchWidth
} from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { createElement, createRef, Fragment } from '@fullcalendar/core/preact'
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
import { EntityScroll, ResourceTimelineLayoutNormal, TimeScroll } from './ResourceTimelineLayoutNormal.js'
import { ResourceTimelineLayoutPrint } from './ResourceTimelineLayoutPrint.js'
import { processColOptions } from '../col-options.js'
import { CssDimValue } from '@fullcalendar/core'
import { pixelizeDimConfigs, resizeSiblingDimConfig, SiblingDimConfig } from '../col-positioning.js'
import { ResourceExpander } from './spreadsheet/ResourceExpander.js'

interface ResourceTimelineViewState {
  colWidthOverrides?: SiblingDimConfig[]
  spreadsheetClientWidth?: number // pixel-width of scroll inner area
  timeClientWidth?: number
  slotInnerWidth?: number
  expanderWidth?: number
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
  private spreadsheetResizedWidthRef = createRef<CssDimValue>() // the CSS dimension. could be percent

  // internal
  private resourceSplitter = new ResourceSplitter()
  private bgSlicer = new TimelineLaneSlicer()
  private spreadsheetColWidthConfigs?: SiblingDimConfig[]
  private spreadsheetColWidths?: number[]
  private disconnectExpanderWidth?: () => void

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

    /* spreadsheet col widths */

    let spreadsheetColWidthConfigs = state.colWidthOverrides || initialColWidthConfigs
    let [spreadsheetColWidths, spreadsheetCanvasWidth] = state.spreadsheetClientWidth != null
      ? pixelizeDimConfigs(spreadsheetColWidthConfigs, state.spreadsheetClientWidth)
      : [undefined, undefined]

    this.spreadsheetColWidthConfigs = spreadsheetColWidthConfigs
    this.spreadsheetColWidths = spreadsheetColWidths

    /* table hierarchy */

    let resourceHierarchy = this.buildResourceHierarchy(
      props.resourceStore,
      orderSpecs,
      groupSpecs,
      groupRowDepth,
    )
    let hasNesting = this.computeHasNesting(resourceHierarchy)

    /* table positions */

    let [timeCanvasWidth, slotWidth, slotLiquid] = this.computeSlotWidth(
      tDateProfile.slotCnt,
      tDateProfile.slotsPerLabel,
      options.slotMinWidth,
      state.slotInnerWidth, // is ACTUALLY the last-level label width. rename?
      state.timeClientWidth
    )

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
      <Fragment>
        <NowTimer unit={timerUnit}>
          {(nowDate: DateMarker, todayRange: DateRange) => {
            const baseProps = {
              className: props.className,
              labelId: props.labelId,
              labelStr: props.labelStr,
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
              eventSelection: props.eventSelection,
              hasResourceBusinessHours,
              fallbackBusinessHours,
              slotWidth,
              timeCanvasWidth,
              spreadsheetColWidths,
              borderlessX: props.borderlessX,
              borderlessTop: props.borderlessTop,
              borderlessBottom: props.borderlessBottom,
              noEdgeEffects: props.noEdgeEffects,
            }

            return props.forPrint ? (
              <ResourceTimelineLayoutPrint
                {...baseProps}
                spreadsheetWidth={
                  this.spreadsheetResizedWidthRef.current ??
                    options.resourceColumnsWidth
                }
                spreadsheetColWidthConfigs={spreadsheetColWidthConfigs}
                timeAreaOffset={this.scrollRef.current.x /* for simulating horizontal scroll */}
                indentWidth={state.expanderWidth}
              />
            ) : (
              <ResourceTimelineLayoutNormal
                {...baseProps}
                slotLiquid={slotLiquid}
                timeClientWidthRef={this.handleTimeClientWidth}
                slotInnerWidthRef={this.handleSlotInnerWidth}
                initialSpreadsheetWidth={
                  this.spreadsheetResizedWidthRef.current ??
                    options.resourceColumnsWidth
                }
                spreadsheetCanvasWidth={spreadsheetCanvasWidth}
                initialScroll={this.scrollRef.current /* for reviving after print-view */}

                // refs
                spreadsheetResizedWidthRef={this.spreadsheetResizedWidthRef} // for resource-area resize
                spreadsheetClientWidthRef={this.handleSpreadsheetClientWidth} // for pixel value
                scrollRef={this.scrollRef}

                // handlers
                onColResize={this.handleColResize}
                indentWidth={state.expanderWidth}
              />
            )
          }}
        </NowTimer>
        <ResourceExpander // for probing size
          isExpanded
          elRef={this.handleExpanderEl}
          className={classNames.offscreen}
        />
      </Fragment>
    )
  }

  handleColResize = (colIndex: number, newWidth: number) => {
    const colWidthOverrides = resizeSiblingDimConfig(
      this.spreadsheetColWidthConfigs,
      this.spreadsheetColWidths,
      this.state.spreadsheetClientWidth,
      colIndex,
      newWidth,
    )

    this.setState({ colWidthOverrides })
  }

  handleSpreadsheetClientWidth = (spreadsheetClientWidth: number | null) => {
    if (spreadsheetClientWidth != null) {
      this.setState({ spreadsheetClientWidth })
    }
  }

  handleTimeClientWidth = (timeClientWidth: number | null) => {
    if (timeClientWidth != null) {
      this.setState({ timeClientWidth })
    }
  }

  handleSlotInnerWidth = (slotInnerWidth: number | null) => {
    if (slotInnerWidth != null) {
      this.setState({ slotInnerWidth })
    }
  }

  handleExpanderEl = (expanderEl: HTMLElement | null) => {
    if (this.disconnectExpanderWidth) {
      this.disconnectExpanderWidth()
      this.disconnectExpanderWidth = undefined
    }

    if (expanderEl) {
      this.disconnectExpanderWidth = watchWidth(expanderEl, (width) => {
        this.setState({ expanderWidth: width })
      })
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
