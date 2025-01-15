import { LocaleInput } from '../index.js'

export default {
  code: 'is',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: 'Fyrri',
    next: 'Næsti',
    today: 'Í dag',
    year: 'Ár',
    month: 'Mánuður',
    week: 'Vika',
    day: 'Dagur',
    list: 'Dagskrá',
  },
  weekText: 'Vika',
  allDayText: 'Allan\ndaginn',
  moreLinkText: 'meira',
  noEventsText: 'Engir viðburðir til að sýna',
} as LocaleInput
