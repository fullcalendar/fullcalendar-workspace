import { MoreLinkContentArg, CssDimValue } from '@fullcalendar/core'
import {
  MoreLinkContainer, BaseComponent,
  Dictionary, DateProfile, DateRange, DateMarker, EventSegUiInteractionState,
  EventRangeProps,
  joinArrayishClassNames,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { renderPlainFgSegs } from './TimeGridCol.js' // BAD
import { TimeGridRange } from '../TimeColsSeg.js'

export interface TimeGridMoreLinkProps {
  hiddenSegs: (TimeGridRange & EventRangeProps)[]
  top: CssDimValue
  height: CssDimValue
  dateSpanProps?: Dictionary
  dateProfile: DateProfile
  todayRange: DateRange
  nowDate: DateMarker
  eventSelection: string
  eventDrag: EventSegUiInteractionState<TimeGridRange>
  eventResize: EventSegUiInteractionState<TimeGridRange>
}

export class TimeGridMoreLink extends BaseComponent<TimeGridMoreLinkProps> {
  render() {
    let { props } = this
    let { options } = this.context

    return (
      <MoreLinkContainer
        className='fc-abs'
        style={{
          top: props.top,
          height: props.height,
        }}
        allDayDate={null}
        segs={props.hiddenSegs}
        hiddenSegs={props.hiddenSegs}
        dateSpanProps={props.dateSpanProps}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        popoverContent={() => renderPlainFgSegs(props.hiddenSegs, props)}
        defaultGenerator={renderMoreLinkInner}
        forceTimed={true}
      >
        {(InnerContent) => (
          <InnerContent
            tag="div"
            className={joinArrayishClassNames(
              options.moreLinkInnerClassNames,
              'fc-sticky-t',
            )}
          />
        )}
      </MoreLinkContainer>
    )
  }
}

function renderMoreLinkInner(props: MoreLinkContentArg) {
  return props.shortText
}
