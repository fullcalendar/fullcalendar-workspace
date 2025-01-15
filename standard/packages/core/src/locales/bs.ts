import { LocaleInput } from '../index.js'

export default {
  code: 'bs',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 7, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: 'Prošli',
    next: 'Sljedeći',
    today: 'Danas',
    year: 'Godina',
    month: 'Mjesec',
    week: 'Sedmica',
    day: 'Dan',
    list: 'Raspored',
  },
  weekText: 'Sed',
  allDayText: 'Cijeli\ndan',
  moreLinkText(n) {
    return '+ još ' + n
  },
  noEventsText: 'Nema događaja za prikazivanje',
} as LocaleInput
