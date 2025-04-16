import { LocaleInput } from '../index.js'

export default {
  code: 'en-gb',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  weekTextShort: 'W',
  todayHint: 'This $0',
  prevHint: 'Previous $0',
  nextHint: 'Next $0',
  viewHint: '$0 view',
  navLinkHint: 'Go to $0',
  moreLinkHint(eventCnt: number) {
    return `Show ${eventCnt} more event${eventCnt === 1 ? '' : 's'}`
  },
} as LocaleInput
