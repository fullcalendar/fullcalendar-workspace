import { DateProfile } from './DateProfileGenerator'
import { CalendarData } from '../store/data-types'
import { RangeApiWithTimeZone, buildRangeApiWithTimeZone } from '../events/date-span'
import { ViewApi } from '../api/ViewApi'

export type DatesSetInfo = RangeApiWithTimeZone & { view: ViewApi }

export function handleDateProfile(dateProfile: DateProfile, context: CalendarData) {
  context.emitter.trigger('datesSet', {
    ...buildRangeApiWithTimeZone(dateProfile.activeRange, context.dateEnv),
    view: context.viewApi,
  })
}
