import { LocaleInput } from '../index.js'

export default {
  code: 'is',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  prevText: 'Fyrri',
  nextText: 'Næsti',
  todayText: 'Í dag',
  yearText: 'Ár',
  monthText: 'Mánuður',
  weekText: 'Vika',
  dayText: 'Dagur',
  listText: 'Dagskrá',
  allDayText: 'Allan\ndaginn',
  moreLinkText: 'meira',
  noEventsText: 'Engir viðburðir til að sýna',
} as LocaleInput
