import { CssDimValue, joinClassNames } from '@fullcalendar/core'
import {
  MoreLinkContainer, BaseComponent,
  Dictionary, DateProfile, DateRange, DateMarker, EventSegUiInteractionState,
  EventRangeProps,
} from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
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
  isNarrow: boolean
  isMicro: boolean
}

export class TimeGridMoreLink extends BaseComponent<TimeGridMoreLinkProps> {
  render() {
    let { props } = this

    return (
      <div // the "harness"
        className={joinClassNames(
          classNames.abs,
          classNames.flexCol,
        )}
        style={{
          top: props.top,
          height: props.height,
          insetInlineEnd: 0,
          zIndex: 9999, // HACK. move to className?
        }}
      >
        <MoreLinkContainer
          className={classNames.liquid}
          display='column'
          allDayDate={null}
          segs={props.hiddenSegs}
          hiddenSegs={props.hiddenSegs}
          dateSpanProps={props.dateSpanProps}
          dateProfile={props.dateProfile}
          todayRange={props.todayRange}
          popoverContent={() => renderPlainFgSegs(props.hiddenSegs, props, /* isMirror = */ false)}
          forceTimed={true}
          isNarrow={props.isNarrow}
          isMicro={props.isMicro}
        />
      </div>
    )
  }
}
