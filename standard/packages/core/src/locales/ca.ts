import { LocaleInput } from '../index.js'

export default {
  code: 'ca',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: 'Anterior',
    next: 'Següent',
    today: 'Avui',
    year: 'Any',
    month: 'Mes',
    week: 'Setmana',
    day: 'Dia',
    list: 'Agenda',
  },
  weekText: 'Set',
  allDayText: 'Tot\nel dia',
  moreLinkText: 'més',
  noEventsText: 'No hi ha esdeveniments per mostrar',
} as LocaleInput
