import { DateProfile, wholeDivideDurations, ComponentContext } from '@fullcalendar/core'
import TimelineHeader from './TimelineHeader'
import TimelineSlats from './TimelineSlats'
import { TimelineDateProfile } from './timeline-date-profile'

export interface TimeColsWidthSyncerProps {
  header: TimelineHeader
  slats: TimelineSlats
  tDateProfile: TimelineDateProfile
  dateProfile: DateProfile
  availableWidth: number
}

export default class TimeColsWidthSyncer {

  props: TimeColsWidthSyncerProps
  context: ComponentContext


  // Sizing
  // ------------------------------------------------------------------------------------------


  updateSize(props: TimeColsWidthSyncerProps, context: ComponentContext) {
    this.props = props
    this.context = context

    return this.applySlotWidth(
      this.computeSlotWidth(),
      props.availableWidth
    )
  }


  computeSlotWidth() {
    let slotWidth = this.context.options.slotWidth || ''

    if (slotWidth === '') {
      slotWidth = this.computeDefaultSlotWidth(this.props.tDateProfile)
    }

    return slotWidth
  }


  computeDefaultSlotWidth(tDateProfile) {
    let { header } = this.props

    let maxInnerWidth = 0 // TODO: harness core's `matchCellWidths` for this

    header.innerEls.forEach(function(innerEl, i) {
      maxInnerWidth = Math.max(maxInnerWidth, innerEl.getBoundingClientRect().width)
    })

    let headingCellWidth = Math.ceil(maxInnerWidth) + 1 // assume no padding, and one pixel border

    // in TimelineView.defaults we ensured that labelInterval is an interval of slotDuration
    // TODO: rename labelDuration?
    let slotsPerLabel = wholeDivideDurations(tDateProfile.labelInterval, tDateProfile.slotDuration)

    let slotWidth = Math.ceil(headingCellWidth / slotsPerLabel)

    let minWidth: any = window.getComputedStyle(header.slatColEls[0]).minWidth
    if (minWidth) {
      minWidth = parseInt(minWidth, 10)
      if (minWidth) {
        slotWidth = Math.max(slotWidth, minWidth)
      }
    }

    return slotWidth
  }


  applySlotWidth(slotWidth: number | string, availableWidth: number) {
    let { header, slats, tDateProfile } = this.props
    let containerWidth: number | string = ''
    let containerMinWidth: number | string = ''
    let nonLastSlotWidth: number | string = ''

    if (slotWidth !== '') {
      slotWidth = Math.round(slotWidth as number)

      containerWidth = slotWidth * tDateProfile.slotDates.length
      containerMinWidth = ''
      nonLastSlotWidth = slotWidth

      if (availableWidth > containerWidth) {
        containerMinWidth = availableWidth
        containerWidth = ''
        nonLastSlotWidth = Math.floor(availableWidth / tDateProfile.slotDates.length)
      }
    }

    if (nonLastSlotWidth !== '') {
      header.slatColEls.slice(0, -1).concat(
        slats.slatColEls.slice(0, -1)
      ).forEach(function(el) {
        el.style.width = nonLastSlotWidth + 'px'
      })
    }

    return { containerWidth, containerMinWidth }
  }

}
