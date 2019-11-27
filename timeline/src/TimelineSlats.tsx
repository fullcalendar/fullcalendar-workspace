import { isInt, findElements, findDirectChildren, PositionCache, getDayClasses, BaseComponent, DateProfile, multiplyDuration, ComponentContext, DateMarker, DateEnv, guid, Duration, startOfDay } from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'
import { h, VNode } from 'preact'


export interface TimelineSlatsProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
}

export default class TimelineSlats extends BaseComponent<TimelineSlatsProps, ComponentContext> {

  rootEl: HTMLElement
  slatColEls: HTMLElement[]
  slatEls: HTMLElement[]

  private outerCoordCache: PositionCache
  private innerCoordCache: PositionCache


  render(props: TimelineSlatsProps, state: {}, context: ComponentContext) {
    let { dateProfile, tDateProfile } = props
    let { theme } = context
    let { slotDates, isWeekStarts } = tDateProfile
    let colGroupNodes: VNode[] = []

    for (let i = 0; i < slotDates.length; i++) {
      colGroupNodes.push(<col/>)
    }

    return ( // guid rerenders whole DOM every time
      <div class='fc-slats' ref={this.handleRootEl} key={guid()}>
        <table class={theme.getClass('tableGrid')}>
          <colgroup>
            {colGroupNodes}
          </colgroup>
          <tbody>
            <tr>
              {slotDates.map((slotDate, i) =>
                renderSlatCell(slotDate, isWeekStarts[i], dateProfile, tDateProfile, context)
              )}
            </tr>
          </tbody>
        </table>
      </div>
    )
  }


  handleRootEl = (rootEl: HTMLElement | null) => {
    let { calendar, view, dateEnv } = this.context
    let { slotDates } = this.props.tDateProfile

    if (rootEl) {
      this.rootEl = rootEl

      let slatColEls = findElements(rootEl, 'col')
      let slatEls = findElements(rootEl, 'td')

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
        rootEl,
        slatEls,
        true, // isHorizontal
        false // isVertical
      )

      // for the inner divs within the slats
      // used for event rendering and scrollTime, to disregard slat border
      this.innerCoordCache = new PositionCache(
        rootEl,
        findDirectChildren(slatEls, 'div'),
        true, // isHorizontal
        false // isVertical
      )
    }
  }


  buildPositionCaches() {
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


  rangeToCoords(range) {
    if (this.context.isRtl) {
      return { right: this.dateToCoord(range.start), left: this.dateToCoord(range.end) }
    } else {
      return { left: this.dateToCoord(range.start), right: this.dateToCoord(range.end) }
    }
  }


  // for LTR, results range from 0 to width of area
  // for RTL, results range from negative width of area to 0
  dateToCoord(date) {
    let { tDateProfile } = this.props
    let snapCoverage = this.computeDateSnapCoverage(date)
    let slotCoverage = snapCoverage / tDateProfile.snapsPerSlot
    let slotIndex = Math.floor(slotCoverage)
    slotIndex = Math.min(slotIndex, tDateProfile.slotCnt - 1)
    let partial = slotCoverage - slotIndex
    let { innerCoordCache, outerCoordCache } = this

    if (this.context.isRtl) {
      return (
        outerCoordCache.rights[slotIndex] -
        (innerCoordCache.getWidth(slotIndex) * partial)
      ) - outerCoordCache.originClientRect.width
    } else {
      return (
        outerCoordCache.lefts[slotIndex] +
        (innerCoordCache.getWidth(slotIndex) * partial)
      )
    }
  }


  // returned value is between 0 and the number of snaps
  computeDateSnapCoverage(date: DateMarker): number {
    return computeDateSnapCoverage(date, this.props.tDateProfile, this.context.dateEnv)
  }


  computeDurationLeft(duration: Duration) {
    let { dateEnv, isRtl } = this.context
    let { dateProfile } = this.props
    let left = 0

    if (dateProfile) {
      left = this.dateToCoord(
        dateEnv.add(
          startOfDay(dateProfile.activeRange.start), // startOfDay needed?
          duration
        )
      )

      // hack to overcome the left borders of non-first slat
      if (!isRtl && left) {
        left += 1
      }
    }

    return left
  }

}


function renderSlatCell(date, isEm, dateProfile: DateProfile, tDateProfile: TimelineDateProfile, context: ComponentContext) {
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

  return (
    <td class={classes.join(' ')}
      data-date={dateEnv.formatIso(date, { omitTime: !tDateProfile.isTimeScale, omitTimeZoneOffset: true })}
    ><div></div></td>
  )
}


// returned value is between 0 and the number of snaps
export function computeDateSnapCoverage(date: DateMarker, tDateProfile: TimelineDateProfile, dateEnv: DateEnv): number {
  let snapDiff = dateEnv.countDurationsBetween(
    tDateProfile.normalizedRange.start,
    date,
    tDateProfile.snapDuration
  )

  if (snapDiff < 0) {
    return 0
  } else if (snapDiff >= tDateProfile.snapDiffToIndex.length) {
    return tDateProfile.snapCnt
  } else {
    let snapDiffInt = Math.floor(snapDiff)
    let snapCoverage = tDateProfile.snapDiffToIndex[snapDiffInt]

    if (isInt(snapCoverage)) { // not an in-between value
      snapCoverage += snapDiff - snapDiffInt // add the remainder
    } else {
      // a fractional value, meaning the date is not visible
      // always round up in this case. works for start AND end dates in a range.
      snapCoverage = Math.ceil(snapCoverage)
    }

    return snapCoverage
  }
}
