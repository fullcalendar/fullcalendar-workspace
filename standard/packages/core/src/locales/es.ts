import { LocaleInput } from '../index.js'

export default {
  code: 'es',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  prevText: 'Ant',
  nextText: 'Sig',
  todayText: 'Hoy',
  yearText: 'Año',
  monthText: 'Mes',
  weekText: 'Semana',
  weekTextShort: 'Sm',
  dayText: 'Día',
  listText: 'Agenda',
  prevHint: '$0 antes',
  nextHint: '$0 siguiente',
  todayHint: (unitText) => {
    return (unitText === 'Día') ? 'Hoy' :
      ((unitText === 'Semana') ? 'Esta' : 'Este') + ' ' + unitText.toLocaleLowerCase()
  },
  viewHint(unitText) {
    return 'Vista ' + (unitText === 'Semana' ? 'de la' : 'del') + ' ' + unitText.toLocaleLowerCase()
  },
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
