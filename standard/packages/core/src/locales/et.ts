import { LocaleInput } from '../index.js'

export default {
  code: 'et',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: 'Eelnev',
    next: 'Järgnev',
    today: 'Täna',
    year: 'Aasta',
    month: 'Kuu',
    week: 'Nädal',
    day: 'Päev',
    list: 'Päevakord',
  },
  weekText: 'näd',
  allDayText: 'Kogu\npäev',
  moreLinkText(n) {
    return '+ veel ' + n
  },
  noEventsText: 'Kuvamiseks puuduvad sündmused',
} as LocaleInput
