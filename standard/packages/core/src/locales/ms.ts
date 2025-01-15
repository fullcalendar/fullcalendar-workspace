import { LocaleInput } from '../index.js'

export default {
  code: 'ms',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 7, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: 'Sebelum',
    next: 'Selepas',
    today: 'hari ini',
    year: 'Tahun',
    month: 'Bulan',
    week: 'Minggu',
    day: 'Hari',
    list: 'Agenda',
  },
  weekText: 'Mg',
  allDayText: 'Sepanjang\nhari',
  moreLinkText(n) {
    return 'masih ada ' + n + ' acara'
  },
  noEventsText: 'Tiada peristiwa untuk dipaparkan',
} as LocaleInput
