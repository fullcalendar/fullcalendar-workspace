import { ClassNamesInput } from '@fullcalendar/core'
import { Identity, identity } from '@fullcalendar/core/internal'

export const OPTION_REFINERS = {
  allDaySlot: Boolean,
  allDayDividerClassNames: identity as Identity<ClassNamesInput>,
}
