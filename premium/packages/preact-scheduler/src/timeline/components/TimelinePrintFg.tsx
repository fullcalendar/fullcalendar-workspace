import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  EventRangeProps,
  getEventRangeMeta,
  memoize,
  PrintEventBand,
  PrintMoreLinkBand,
  RefMap,
  sortEventSegs,
  MeasuredAbsoluteHarness,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type TimelineDateProfile } from '../timeline-date-profile'
import { type TimelineRange } from '../TimelineLaneSlicer'
import {
  TimelinePrintHeights,
  buildTimelinePrintPlan,
} from '../print-adapter'
import { type TimelineEventSeg } from '../seg-placement-adapter'
import { resolveTimelineEventProjectionSizing } from '../slot-estimate'
import { TimelineEvent } from './TimelineEvent'
import { TimelineLaneMoreLink } from './TimelineLaneMoreLink'

export interface TimelinePrintFgProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange

  // content
  fgEventSegs: (TimelineRange & EventRangeProps)[]
  eventSelection: string
  resourceId?: string

  // dimensions
  slotWidth: number | undefined
}

export class TimelinePrintFg extends BaseComponent<TimelinePrintFgProps> {
  // memo
  private sortEventSegs = memoize(sortEventSegs)
  private buildPrintPlan = memoize(buildTimelinePrintPlan)

  // refs
  private printHeights = new TimelinePrintHeights(() => this.handlePrintHeights())

  // internal
  private _isUnmounting: boolean

  render() {
    const { props, context } = this
    const { options } = context
    const fgSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder)
    const projectionSizing = resolveTimelineEventProjectionSizing(
      props.slotWidth,
      options.eventMinWidth,
    )
    const plan = this.buildPrintPlan(
      fgSegs,
      context.dateEnv,
      props.tDateProfile,
      projectionSizing.slotWidth,
      projectionSizing.eventMinWidth,
      options.eventOrderStrict,
    )
    const { eventBands, moreLinkBand } = this.printHeights.buildLayout(plan)

    return (
      <div className={classNames.noShrink}>
        {eventBands.map((band) => (
          <TimelinePrintEventBand
            key={band.levelIndex}
            band={band}
            heightRefMap={this.printHeights.segHeightRefMap}
            dateProfile={props.dateProfile}
            tDateProfile={props.tDateProfile}
            nowDate={props.nowDate}
            nowMs={props.nowMs}
            todayRange={props.todayRange}
            eventSelection={props.eventSelection}
            resourceId={props.resourceId}
          />
        ))}
        {moreLinkBand && (
          <TimelinePrintMoreLinkBand
            band={moreLinkBand}
            heightRefMap={this.printHeights.linkHeightRefMap}
            dateProfile={props.dateProfile}
            tDateProfile={props.tDateProfile}
            nowDate={props.nowDate}
            nowMs={props.nowMs}
            todayRange={props.todayRange}
            eventSelection={props.eventSelection}
            resourceId={props.resourceId}
          />
        )}
      </div>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
  }

  private handlePrintHeights = () => {
    if (this._isUnmounting) return
    this.forceUpdate()
  }
}

interface TimelinePrintBandBaseProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  nowMs: number
  todayRange: DateRange
  eventSelection: string
  resourceId?: string
}

export interface TimelinePrintEventBandProps extends TimelinePrintBandBaseProps {
  band: PrintEventBand<TimelineEventSeg>
  heightRefMap: RefMap<string, number>
}

/** Renders one independently page-breakable Timeline print event band. */
export function TimelinePrintEventBand(props: TimelinePrintEventBandProps) {
  const { band } = props

  return (
    <div
      className={joinClassNames(classNames.rel, classNames.breakInsideAvoid)}
      style={{ height: band.thickness }}
    >
      {band.slices.map((slice) => {
        const { sourceSeg } = slice
        const seg = sourceSeg.meta
        const { eventRange } = seg
        const { instanceId } = eventRange.instance
        const isSelected = instanceId === props.eventSelection

        return (
          <MeasuredAbsoluteHarness
            key={sourceSeg.key}
            style={{
              zIndex: isSelected ? 1000 : 1,
              top: 0,
              insetInlineStart: slice.start,
              width: slice.end - slice.start,
            }}
            heightRef={props.heightRefMap.createRef(sourceSeg.key)}
          >
            <TimelineEvent
              isTimeScale={props.tDateProfile.isTimeScale}
              eventRange={eventRange}
              isStart={slice.isStart}
              isEnd={slice.isEnd}
              isDragging={false}
              isResizing={false}
              isMirror={false}
              isSelected={isSelected}
              {...getEventRangeMeta(eventRange, props.todayRange, props.nowDate, props.nowMs)}
            />
          </MeasuredAbsoluteHarness>
        )
      })}
    </div>
  )
}

export interface TimelinePrintMoreLinkBandProps extends TimelinePrintBandBaseProps {
  band: PrintMoreLinkBand<TimelineEventSeg>
  heightRefMap: RefMap<string, number>
}

/** Renders Timeline's final independently page-breakable print more-link band. */
export function TimelinePrintMoreLinkBand(props: TimelinePrintMoreLinkBandProps) {
  const { band } = props

  return (
    <div
      className={joinClassNames(classNames.rel, classNames.breakInsideAvoid)}
      style={{ height: band.thickness }}
    >
      {band.moreLinkGroups.map((group) => (
        <MeasuredAbsoluteHarness
          key={group.key}
          style={{
            top: 0,
            insetInlineStart: group.start,
            width: group.end - group.start,
          }}
          heightRef={props.heightRefMap.createRef(group.key)}
        >
          <TimelineLaneMoreLink
            hiddenSegs={group.hiddenSlices.map((slice) => slice.sourceSeg.meta)}
            dateProfile={props.dateProfile}
            nowDate={props.nowDate}
            nowMs={props.nowMs}
            todayRange={props.todayRange}
            isTimeScale={props.tDateProfile.isTimeScale}
            eventDrag={null}
            eventResize={null}
            eventSelection={props.eventSelection}
            resourceId={props.resourceId}
          />
        </MeasuredAbsoluteHarness>
      ))}
    </div>
  )
}
