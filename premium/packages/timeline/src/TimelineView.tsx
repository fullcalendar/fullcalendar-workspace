import { ViewProps, memoize, ViewContainer, DateComponent, Hit, greatestDurationDenominator, NowTimer, DateMarker, DateRange, NowIndicatorContainer, getStickyHeaderDates, getStickyFooterScrollbar } from '@fullcalendar/core/internal'
import { Fragment, createElement, createRef } from '@fullcalendar/core/preact'
import { buildTimelineDateProfile, TimelineDateProfile } from './timeline-date-profile.js'
import { TimelineHeader } from './TimelineHeader.js'
import { TimelineCoords, coordToCss } from './TimelineCoords.js'
import { TimelineSlats } from './TimelineSlats.js'
import { TimelineLane } from './TimelineLane.js'

interface TimelineViewState {
  slatCoords: TimelineCoords | null
  slotCushionMaxWidth: number | null
}

export class TimelineView extends DateComponent<ViewProps, TimelineViewState> {
  private buildTimelineDateProfile = memoize(buildTimelineDateProfile)
  private slatsRef = createRef<TimelineSlats>()

  state = {
    slatCoords: null,
    slotCushionMaxWidth: null,
  }

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
    let slatCols = buildSlatCols(tDateProfile, slotMinWidth || this.computeFallbackSlotMinWidth(tDateProfile))

    console.log('TODO use cols', slatCols)

    let timerUnit = greatestDurationDenominator(tDateProfile.slotDuration).unit

    let liquidHeight = !props.isHeightAuto && !props.forPrint

    let stickyHeaderDates = !props.forPrint && getStickyHeaderDates(options)

    let stickyFooterScrollbar = !props.forPrint && getStickyFooterScrollbar(options)

    /*
    TODO:
    - tabindex
    - forPrint / collapsibleWidth (not needed anymore?)
    */
    return (
      <ViewContainer
        elClasses={[
          'fc-timeline',
          options.eventOverlap === false ?
            'fc-timeline-overlap-disabled' :
            '',
        ]}
        viewSpec={context.viewSpec}
      >
        <div style={{ height: liquidHeight ? '100%' : '' }}>
          <TimelineHeader
            dateProfile={props.dateProfile}
            tDateProfile={tDateProfile}
            slatCoords={state.slatCoords}
            onMaxCushionWidth={slotMinWidth ? null : this.handleMaxCushionWidth}
            isVerticallySticky={stickyHeaderDates}
          />
          <div
            className="fc-timeline-body"
            ref={this.handeBodyEl}
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
          {stickyFooterScrollbar && (
            <div class='fc-newnew-scroller'>
              <div />{/* TODO: canvas width */}
            </div>
          )}
        </div>
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
      slotCushionMaxWidth: Math.ceil(slotCushionMaxWidth), // for less rerendering TODO: DRY
    })
  }

  computeFallbackSlotMinWidth(tDateProfile: TimelineDateProfile) { // TODO: duplicate definition
    return Math.max(30, ((this.state.slotCushionMaxWidth || 0) / tDateProfile.slotsPerLabel))
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

export function buildSlatCols(tDateProfile: TimelineDateProfile, slotMinWidth?: number) {
  return [{
    span: tDateProfile.slotCnt,
    minWidth: slotMinWidth || 1, // needs to be a non-zero number to trigger horizontal scrollbars!??????
  }]
}
