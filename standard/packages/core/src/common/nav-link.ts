import { createFormatter } from '../datelib/formatting.js'
import { DateMarker } from '../datelib/marker.js'
import { joinArrayishClassNames } from '../internal.js'
import { createAriaClickAttrs } from '../util/dom-event.js'
import { formatWithOrdinals } from '../util/misc.js'
import { ViewContext } from '../ViewContext.js'
import classNames from '../internal-classnames.js'

const DAY_FORMAT = createFormatter({ year: 'numeric', month: 'long', day: 'numeric' })
const WEEK_FORMAT = createFormatter({ week: 'long' })

/*
TODO: just have this return the string?
*/
export function buildDateStr(
  context: ViewContext,
  dateMarker: DateMarker,
  viewType = 'day',
): string {
  return context.dateEnv.format(dateMarker, viewType === 'week' ? WEEK_FORMAT : DAY_FORMAT)[0]
}

/*
Assumes navLinks enabled
Always hidden to screen readers. Do not point aria-labelledby at this. Use aria-label instead.
*/
export function buildNavLinkAttrs(
  context: ViewContext,
  dateMarker: DateMarker,
  viewType = 'day',
  dateStr = buildDateStr(context, dateMarker, viewType),
  isTabbable = true,
) {
  const { dateEnv, options, calendarApi } = context
  const zonedDate = dateEnv.toDate(dateMarker)

  const handleInteraction = (ev: UIEvent) => {
    let customAction =
      viewType === 'day' ? options.navLinkDayClick :
        viewType === 'week' ? options.navLinkWeekClick : null

    if (typeof customAction === 'function') {
      customAction.call(calendarApi, dateEnv.toDate(dateMarker), ev)
    } else {
      if (typeof customAction === 'string') {
        viewType = customAction
      }
      calendarApi.zoomTo(dateMarker, viewType)
    }
  }

  return {
    'role': ('link' as any), // TODO
    'aria-label': formatWithOrdinals(options.navLinkHint, [dateStr, zonedDate], dateStr),
    'className': joinArrayishClassNames(
      options.navLinkClassNames,
      classNames.cursorPointer,
      classNames.internalNavLink,
    ),
    ...(isTabbable
      ? createAriaClickAttrs(handleInteraction)
      : { onClick: handleInteraction }
    ),
  }
}
