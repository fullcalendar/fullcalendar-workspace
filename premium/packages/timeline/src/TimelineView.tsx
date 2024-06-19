import { ViewProps, memoize, ViewContainer, DateComponent, Hit, greatestDurationDenominator, NowTimer, DateMarker, DateRange, NowIndicatorContainer, getStickyHeaderDates, getStickyFooterScrollbar, NewScroller } from '@fullcalendar/core/internal'
import { Fragment, createElement, createRef } from '@fullcalendar/core/preact'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile.js'
import { TimelineHeader } from './TimelineHeader.js'
import { TimelineCoords, coordToCss } from './TimelineCoords.js'
import { TimelineSlats } from './TimelineSlats.js'
import { TimelineLane } from './TimelineLane.js'

interface TimelineViewState {
  slatCoords?: TimelineCoords
  slotCushionMaxWidth?: number
  bodyInnerWidth?: number,
  leftScrollbarWidth?: number,
  rightScrollbarWidth?: number,
}

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> {
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private slatsRef = createRef<TimelineSlats>()

  render() {
    let { props, state, context } = this
    let { options } = context

    let tDateProfile = this.buildTimelineDateProfile(
      props.dateProfile,
      context.dateEnv,
      options,
      context.dateProfileGenerator,
    )

    let { slotMinWidth } = options
    let [normalSlotWidth, lastSlotWidth, canvasWidth] = computeSlotWidth( // TODO: memoize
      tDateProfile,
      state.slotCushionMaxWidth,
      state.bodyInnerWidth
    )

    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    let stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    let stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    /*
    TODO:
    - tabindex
    - forPrint / collapsibleWidth (not needed anymore?)
    - forceScrollLeft, etc
    - scroll-joiners
    - onNaturalHeight handlers
    */
    return (
      <ViewContainer
        elClasses={[
          'fc-newnew-flexparent',
          'fc-timeline',
          options.eventOverlap === false ?
            'fc-timeline-overlap-disabled' :
            '',
        ]}
        viewSpec={context.viewSpec}
      >
        <NewScroller
          horizontal
          hideBars
          className={stickyHeaderDates ? 'fc-newnew-v-sticky' : ''}
        >
          <div style={{
            width: canvasWidth,
            paddingLeft: state.leftScrollbarWidth,
            paddingRight: state.rightScrollbarWidth,
          }}>
            <TimelineHeader
              dateProfile={props.dateProfile}
              tDateProfile={tDateProfile}
              slatCoords={state.slatCoords}
              onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
            />
          </div>
        </NewScroller>
        <NewScroller // how does it know to be liquid-height?
          vertical
          horizontal
          className='fc-newnew-flexexpand'
          onWidth={this.handleBodyInnerWidth}
          onLeftScrollbarWidth={this.handleLeftScrollbarWidth}
          onRightScrollbarWidth={this.handleRightScrollbarWidth}
        >
          <div
            ref={this.handeBodyEl}
            className="fc-timeline-body"
          >
            <NowTimer unit={timerUnit}>
              {(nowDate: DateMarker, todayRange: DateRange) => (
                <Fragment>
                  <TimelineSlats
                    ref={this.slatsRef}
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}
                    normalSlotWidth={normalSlotWidth}
                    lastSlotWidth={lastSlotWidth}
                    onCoords={this.handleSlatCoords}
                    onScrollLeftRequest={this.handleScrollLeftRequest}
                  />
                  <TimelineLane
                    dateProfile={props.dateProfile}
                    tDateProfile={tDateProfile}
                    nowDate={nowDate}
                    todayRange={todayRange}
                    nextDayThreshold={options.nextDayThreshold}
                    businessHours={props.businessHours}
                    eventStore={props.eventStore}
                    eventUiBases={props.eventUiBases}
                    dateSelection={props.dateSelection}
                    eventSelection={props.eventSelection}
                    eventDrag={props.eventDrag}
                    eventResize={props.eventResize}
                    timelineCoords={state.slatCoords}
                    syncParentMinHeight
                  />
                  {(options.nowIndicator && state.slatCoords && state.slatCoords.isDateInRange(nowDate)) && (
                    <div className="fc-timeline-now-indicator-container">
                      <NowIndicatorContainer
                        elClasses={['fc-timeline-now-indicator-line']}
                        elStyle={coordToCss(state.slatCoords.dateToCoord(nowDate), context.isRtl)}
                        isAxis={false}
                        date={nowDate}
                      />
                    </div>
                  )}
                </Fragment>
              )}
            </NowTimer>
          </div>
        </NewScroller>
        {stickyFooterScrollbar && (
          <NewScroller horizontal>
            <div style={{ width: canvasWidth }}/>
          </NewScroller>
        )}
      </ViewContainer>
    )
  }

  handleSlatCoords = (slatCoords: TimelineCoords | null) => {
    this.setState({ slatCoords })
  }

  handleScrollLeftRequest = (scrollLeft: number) => {
    this.forceScrollLeft(scrollLeft)
  }

  handleMaxCushionWidth = (slotCushionMaxWidth) => {
    this.setState({
      slotCushionMaxWidth,
    })
  }

  handleBodyInnerWidth = (bodyInnerWidth: number) => {
    this.setState({
      bodyInnerWidth,
    })
  }

  handleLeftScrollbarWidth = (leftScrollbarWidth: number) => {
    this.setState({
      leftScrollbarWidth
    })
  }

  handleRightScrollbarWidth = (rightScrollbarWidth: number) => {
    this.setState({
      rightScrollbarWidth
    })
  }

  forceScrollLeft(left: number): void { // just time-scroll
    // TODO
  }

  // Hit System
  // ------------------------------------------------------------------------------------------

  handeBodyEl = (el: HTMLElement | null) => {
    if (el) {
      this.context.registerInteractiveComponent(this, { el })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    let slats = this.slatsRef.current
    let slatHit = slats.positionToHit(positionLeft)

    if (slatHit) {
      return {
        dateProfile: this.props.dateProfile,
        dateSpan: slatHit.dateSpan,
        rect: {
          left: slatHit.left,
          right: slatHit.right,
          top: 0,
          bottom: elHeight,
        },
        dayEl: slatHit.dayEl,
        layer: 0,
      }
    }

    return null
  }
}

export function computeSlotWidth(
  tDateProfile: TimelineDateProfile,
  minSlatContent: number | number, // TODO: if either is undefined, return undefined
  availableWidth: number | number, //
): [number, number, number] { // [normalWidth, lastWidth, totalWidth]
  // const slatMinWidth = Math.max(30, ((slatMaxWidth || 0) / tDateProfile.slotsPerLabel))
  return null as any
}
