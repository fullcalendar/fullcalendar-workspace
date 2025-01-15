import { LocaleInput } from '../index.js'

export default {
  code: 'nn',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: 'Førre',
    next: 'Neste',
    today: 'I dag',
    year: 'År',
    month: 'Månad',
    week: 'Veke',
    day: 'Dag',
    list: 'Agenda',
  },
  weekText: 'Veke',
  allDayText: 'Heile\ndagen',
  moreLinkText: 'til',
  noEventsText: 'Ingen hendelser å vise',
} as LocaleInput
