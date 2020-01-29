import { greatestDurationDenominator } from '@fullcalendar/core'
import { TimelineDateProfile } from './timeline-date-profile'


export function getTimelineNowIndicatorUnit(tDateProfile: TimelineDateProfile) {
  if (tDateProfile.isTimeScale) {
    return greatestDurationDenominator(tDateProfile.slotDuration).unit
  }
}
