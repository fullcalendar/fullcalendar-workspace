import { LocaleInput } from '../index.js'

export default {
  code: 'es',
  week: {
    dow: 0, // Sunday is the first day of the week.
    doy: 6, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: 'Ant',
    next: 'Sig',
    today: 'Hoy',
    year: 'Año',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    list: 'Agenda',
  },
  weekText: 'Sm',
  allDayText: 'Todo\nel día',
  moreLinkText: 'más',
  noEventsText: 'No hay eventos para mostrar',
} as LocaleInput
