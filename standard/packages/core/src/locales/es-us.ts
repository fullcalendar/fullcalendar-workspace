import { LocaleInput } from '../index.js'

export default {
  code: 'es',
  week: {
    dow: 0, // Sunday is the first day of the week.
    doy: 6, // The week that contains Jan 1st is the first week of the year.
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
  noEventsText: 'No hay eventos para mostrar',
} as LocaleInput
