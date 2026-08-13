import { joinClassNames } from '@fullcalendar/preact/public-api'
import {
  afterSize,
  BaseComponent,
  DateMarker,
  DateProfile,
  DateRange,
  EventRangeProps,
  getEventRangeMeta,
  memoize,
  RefMap,
  sortEventSegs,
} from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type TimelineDateProfile } from '../timeline-date-profile'
import { type TimelineRange } from '../TimelineLaneSlicer'
import {
  buildTimelinePrintLayout,
  buildTimelinePrintPlan,
} from '../print-adapter'
import { TimelineEvent } from './TimelineEvent'
import { TimelineEventHarness } from './TimelineEventHarness'
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
  private handlePrintHeightChange = () => {
    afterSize(this.handlePrintHeights)
  }
  // A source can change bands when slotWidth changes; a departing wrapper's
  // deletion must not clobber the arriving wrapper's live entry.
  private printSegHeightRefMap = new RefMap<string, number>(this.handlePrintHeightChange, true)
  private printLinkHeightRefMap = new RefMap<string, number>(this.handlePrintHeightChange)

  // internal
  private _isUnmounting: boolean

  render() {
    const { props, context } = this
    const { options } = context
    const fgSegs = this.sortEventSegs(props.fgEventSegs, options.eventOrder)
    const plan = this.buildPrintPlan(
      fgSegs,
      context.dateEnv,
      props.tDateProfile,
      props.slotWidth ?? 0,
      options.eventMinWidth,
      options.eventOrderStrict,
    )
    const { eventBands, moreLinkBand } = buildTimelinePrintLayout(
      plan,
      this.printSegHeightRefMap.current,
      this.printLinkHeightRefMap.current,
    )

    return (
      <div className={classNames.noShrink}>
        {eventBands.map((band) => (
          <div
            key={band.levelIndex}
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
                <TimelineEventHarness
                  key={sourceSeg.key}
                  style={{
                    zIndex: isSelected ? 1000 : 1,
                    top: 0,
                    insetInlineStart: slice.start,
                    width: slice.end - slice.start,
                  }}
                  heightRef={this.printSegHeightRefMap.createRef(sourceSeg.key)}
                  measureImmediate
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
                </TimelineEventHarness>
              )
            })}
          </div>
        ))}
        {moreLinkBand && (
          <div
            className={joinClassNames(classNames.rel, classNames.breakInsideAvoid)}
            style={{ height: moreLinkBand.thickness }}
          >
            {moreLinkBand.moreLinkGroups.map((group) => (
              <TimelineEventHarness
                key={group.key}
                style={{
                  top: 0,
                  insetInlineStart: group.start,
                  width: group.end - group.start,
                }}
                heightRef={this.printLinkHeightRefMap.createRef(group.key)}
                measureImmediate
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
              </TimelineEventHarness>
            ))}
          </div>
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
