import { LocaleInput } from '../index.js'

function affix(buttonText: string): string {
  return (buttonText === 'Tag' || buttonText === 'Monat') ? 'r' :
    buttonText === 'Jahr' ? 's' : ''
}

export default {
  code: 'de',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  prevText: 'Zurück',
  nextText: 'Vor',
  todayText: 'Heute',
  yearText: 'Jahr',
  monthText: 'Monat',
  weekText: 'Woche',
  weekTextShort: 'KW',
  dayText: 'Tag',
  listText: 'Terminübersicht',
  allDayText: 'Ganztägig',
  moreLinkText(n) {
    return '+ weitere ' + n
  },
  noEventsText: 'Keine Ereignisse anzuzeigen',
  prevHint(buttonText) {
    return `Vorherige${affix(buttonText)} ${buttonText}`
  },
  nextHint(buttonText) {
    return `Nächste${affix(buttonText)} ${buttonText}`
  },
  todayHint(buttonText) {
    // → Heute, Diese Woche, Dieser Monat, Dieses Jahr
    if (buttonText === 'Tag') {
      return 'Heute'
    }
    return `Diese${affix(buttonText)} ${buttonText}`
  },
  viewHint(buttonText) {
    // → Tagesansicht, Wochenansicht, Monatsansicht, Jahresansicht
    const glue = buttonText === 'Woche' ? 'n' : buttonText === 'Monat' ? 's' : 'es'
    return buttonText + glue + 'ansicht'
  },
  navLinkHint: 'Gehe zu $0',
  moreLinkHint(eventCnt: number) {
    return 'Zeige ' + (eventCnt === 1 ?
      'ein weiteres Ereignis' :
      eventCnt + ' weitere Ereignisse')
  },
  closeHint: 'Schließen',
  eventsHint: 'Ereignisse',
} as LocaleInput
