import { LocaleInput } from '../index.js'

export default {
  code: 'es',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
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
  buttonHints: {
    prev: '$0 antes',
    next: '$0 siguiente',
    today(buttonText) {
      return (buttonText === 'Día') ? 'Hoy' :
        ((buttonText === 'Semana') ? 'Esta' : 'Este') + ' ' + buttonText.toLocaleLowerCase()
    },
  },
  viewHint(buttonText) {
    return 'Vista ' + (buttonText === 'Semana' ? 'de la' : 'del') + ' ' + buttonText.toLocaleLowerCase()
  },
  weekText: 'Sm',
  weekTextLong: 'Semana',
  allDayText: 'Todo\nel día',
  moreLinkText: 'más',
  moreLinkHint(eventCnt) {
    return `Mostrar ${eventCnt} eventos más`
  },
  noEventsText: 'No hay eventos para mostrar',
  navLinkHint: 'Ir al $0',
  closeHint: 'Cerrar',
  eventsHint: 'Eventos',
} as LocaleInput
