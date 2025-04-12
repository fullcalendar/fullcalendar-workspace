import { ClassNamesInput } from '@fullcalendar/core'
import { Identity, identity } from '@fullcalendar/core/internal'

export const OPTION_REFINERS = {
  timelineTopClassNames: identity as Identity<ClassNamesInput>,
  timelineBottomClassNames: identity as Identity<ClassNamesInput>,
}
