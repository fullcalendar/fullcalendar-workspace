import { LocaleInput } from '../index.js'

export default {
  code: 'lt',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: 'Atgal',
    next: 'Pirmyn',
    today: 'Šiandien',
    year: 'Metai',
    month: 'Mėnuo',
    week: 'Savaitė',
    day: 'Diena',
    list: 'Darbotvarkė',
  },
  weekText: 'SAV',
  allDayText: 'Visą\ndieną',
  moreLinkText: 'daugiau',
  noEventsText: 'Nėra įvykių rodyti',
} as LocaleInput
