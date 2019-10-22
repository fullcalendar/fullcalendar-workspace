import { isInt, findElements, createElement, findDirectChildren, PositionCache, getDayClasses, Component, DateProfile, multiplyDuration, ComponentContext } from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'

export interface TimelineSlatsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
}

export default class TimelineSlats extends Component<TimelineSlatsProps> {

  slatColEls: HTMLElement[]
  slatEls: HTMLElement[]

  outerCoordCache: PositionCache
  innerCoordCache: PositionCache


  render(props: TimelineSlatsProps, context: ComponentContext) {
    let { dateProfile, tDateProfile } = props
    let { calendar, view, theme, dateEnv } = context
    let { slotDates, isWeekStarts } = tDateProfile

    let html =
      '<table class="' + theme.getClass('tableGrid') + '">' +
      '<colgroup>'

    for (let i = 0; i < slotDates.length; i++) {
      html += '<col/>'
    }

    html += '</colgroup>'
    html += '<tbody><tr>'

    for (let i = 0; i < slotDates.length; i++) {
      html += slatCellHtml(slotDates[i], isWeekStarts[i], dateProfile, tDateProfile, context)
    }

    html += '</tr></tbody></table>'

    let el = createElement('div', { className: 'fc-slats' }, html)
    let slatColEls = findElements(el, 'col')
    let slatEls = findElements(el, 'td')

    for (let i = 0; i < slotDates.length; i++) {
      calendar.publiclyTrigger('dayRender', [
        {
          date: dateEnv.toDate(slotDates[i]),
          el: slatEls[i],
          view
        }
      ])
    }

    this.slatColEls = slatColEls
    this.slatEls = slatEls

    this.outerCoordCache = new PositionCache(
      el,
      slatEls,
      true, // isHorizontal
      false // isVertical
    )

    // for the inner divs within the slats
    // used for event rendering and scrollTime, to disregard slat border
    this.innerCoordCache = new PositionCache(
      el,
      findDirectChildren(slatEls, 'div'),
      true, // isHorizontal
      false // isVertical
    )

    return el
  }


  updateSize() { // just updates position caches
    this.outerCoordCache.build()
    this.innerCoordCache.build()
  }


  positionToHit(leftPosition) {
    let { outerCoordCache } = this
    let { dateEnv, isRtl } = this.context
    let { tDateProfile } = this.props
    let slatIndex = outerCoordCache.leftToIndex(leftPosition)

    if (slatIndex != null) {
      // somewhat similar to what TimeGrid does. consolidate?
      let slatWidth = outerCoordCache.getWidth(slatIndex)
      let partial = isRtl ?
        (outerCoordCache.rights[slatIndex] - leftPosition) / slatWidth :
        (leftPosition - outerCoordCache.lefts[slatIndex]) / slatWidth
      let localSnapIndex = Math.floor(partial * tDateProfile.snapsPerSlot)
      let start = dateEnv.add(
        tDateProfile.slotDates[slatIndex],
        multiplyDuration(tDateProfile.snapDuration, localSnapIndex)
      )
      let end = dateEnv.add(start, tDateProfile.snapDuration)

      return {
        dateSpan: {
          range: { start, end },
          allDay: !this.props.tDateProfile.isTimeScale
        },
        dayEl: this.slatColEls[slatIndex],
        left: outerCoordCache.lefts[slatIndex], // TODO: make aware of snaps?
        right: outerCoordCache.rights[slatIndex]
      }
    }

    return null
  }

}


function slatCellHtml(date, isEm, dateProfile: DateProfile, tDateProfile: TimelineDateProfile, context: ComponentContext) {
  let { theme, dateEnv } = context
  let classes

  if (tDateProfile.isTimeScale) {
    classes = []
    classes.push(
      isInt(dateEnv.countDurationsBetween(
        tDateProfile.normalizedRange.start,
        date,
        tDateProfile.labelInterval
      )) ?
        'fc-major' :
        'fc-minor'
    )
  } else {
    classes = getDayClasses(date, dateProfile, this.context)
    classes.push('fc-day')
  }

  classes.unshift(theme.getClass('widgetContent'))

  if (isEm) {
    classes.push('fc-em-cell')
  }

  return '<td class="' + classes.join(' ') + '"' +
    ' data-date="' + dateEnv.formatIso(date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true }) + '"' +
    '><div></div></td>'
}
