import { MoreLinkContentArg, CssDimValue } from '@fullcalendar/core'
import {
  MoreLinkContainer, BaseComponent,
  Dictionary, DateProfile, DateRange, DateMarker, EventSegUiInteractionState,
} from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { renderPlainFgSegs } from './TimeGridCol.js' // BAD
import { TimeColsSeg } from '../TimeColsSeg.js'

export interface TimeGridMoreLinkProps {
  hiddenSegs: TimeColsSeg[]
  top: CssDimValue
  height: CssDimValue
  extraDateSpan?: Dictionary
  dateProfile: DateProfile
  todayRange: DateRange
  nowDate: DateMarker
  eventSelection: string
  eventDrag: EventSegUiInteractionState
  eventResize: EventSegUiInteractionState
}

export class TimeGridMoreLink extends BaseComponent<TimeGridMoreLinkProps> {
  render() {
    let { props } = this

    return (
      <MoreLinkContainer
        elClasses={['fcnew-timegrid-more-link', 'fcnew-abs']}
        elStyle={{
          top: props.top,
          bottom: props.height,
        }}
        allDayDate={null}
        segs={props.hiddenSegs}
        hiddenSegs={props.hiddenSegs}
        extraDateSpan={props.extraDateSpan}
        dateProfile={props.dateProfile}
        todayRange={props.todayRange}
        popoverContent={() => renderPlainFgSegs(props.hiddenSegs, props)}
        defaultGenerator={renderMoreLinkInner}
        forceTimed={true}
      >
        {(InnerContent) => (
          <InnerContent
            elTag="div"
            elClasses={['fcnew-timegrid-more-link-inner', 'fcnew-sticky-y']}
          />
        )}
      </MoreLinkContainer>
    )
  }
}

function renderMoreLinkInner(props: MoreLinkContentArg) {
  return props.shortText
}
