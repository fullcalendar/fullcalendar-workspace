import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  DateMarker,
  DateProfile,
  DateRange,
  EventRangeProps,
  getEventRangeMeta,
  PrintEventBand,
  PrintMoreLinkBand,
  RefMap,
  MeasuredAbsoluteHarness,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type TimelineDateProfile } from '../timeline-date-profile'
import { type TimelineRange } from '../TimelineLaneSlicer'
import { TimelinePrintRenderer } from '../print-adapter'
import { type TimelineSourceSeg } from '../seg-placement-adapter'
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
  timeCanvasClipStart?: number
}

export class TimelinePrintFg extends TimelinePrintRenderer<TimelinePrintFgProps> {
  render() {
    const { props } = this
    const { eventBands, moreLinkBand } = this.buildPrintBands(
      props.fgEventSegs,
      props.tDateProfile,
      props.slotWidth,
    )

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
            timeCanvasClipStart={props.timeCanvasClipStart}
          />
        ))}
        {moreLinkBand && (
          <TimelinePrintMoreLinkBand
            band={moreLinkBand}
            heightRefMap={this.printHeights.moreLinkHeightRefMap}
            dateProfile={props.dateProfile}
            tDateProfile={props.tDateProfile}
            nowDate={props.nowDate}
            nowMs={props.nowMs}
            todayRange={props.todayRange}
            eventSelection={props.eventSelection}
            resourceId={props.resourceId}
            timeCanvasClipStart={props.timeCanvasClipStart}
          />
        )}
      </div>
    )
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
  timeCanvasClipStart?: number
}

export interface TimelinePrintEventBandProps extends TimelinePrintBandBaseProps {
  band: PrintEventBand<TimelineSourceSeg>
  heightRefMap: RefMap<string, number>
}

/** Renders one independently page-breakable Timeline print event band. */
export function TimelinePrintEventBand(props: TimelinePrintEventBandProps) {
  const { band } = props

  return (
    <div
      className={joinClassNames(classNames.rel, classNames.crop, classNames.breakInsideAvoid)}
      style={{ height: band.thickness }}
    >
      {band.slices.map((slice) => {
        const { sourceSeg } = slice
        const seg = sourceSeg
        const { eventRange } = seg
        const { instanceId } = eventRange.instance
        const isSelected = instanceId === props.eventSelection

        return (
          <MeasuredAbsoluteHarness
            key={sourceSeg.key}
            style={{
              zIndex: isSelected ? 1000 : 1,
              top: 0,
              insetInlineStart: slice.start - (props.timeCanvasClipStart ?? 0),
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
  band: PrintMoreLinkBand<TimelineSourceSeg>
  heightRefMap: RefMap<string, number>
}

/** Renders Timeline's final independently page-breakable print more-link band. */
export function TimelinePrintMoreLinkBand(props: TimelinePrintMoreLinkBandProps) {
  const { band } = props

  return (
    <div
      className={joinClassNames(classNames.rel, classNames.crop, classNames.breakInsideAvoid)}
      style={{ height: band.thickness }}
    >
      {band.moreLinkGroups.map((group) => (
        <MeasuredAbsoluteHarness
          key={group.key}
          style={{
            top: 0,
            insetInlineStart: group.start - (props.timeCanvasClipStart ?? 0),
            width: group.end - group.start,
          }}
          heightRef={props.heightRefMap.createRef(group.key)}
        >
          <TimelineLaneMoreLink
            hiddenSegs={group.hiddenSlices.map((slice) => slice.sourceSeg)}
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
