import { LocaleInput } from '../index.js'

export default {
  code: 'id',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 7, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: 'mundur',
    next: 'maju',
    today: 'hari ini',
    year: 'Tahun',
    month: 'Bulan',
    week: 'Minggu',
    day: 'Hari',
    list: 'Agenda',
  },
  weekText: 'Mg',
  allDayText: 'Sehari\npenuh',
  moreLinkText: 'lebih',
  noEventsText: 'Tidak ada acara untuk ditampilkan',
} as LocaleInput
