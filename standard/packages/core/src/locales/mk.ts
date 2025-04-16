import { LocaleInput } from '../index.js'

export default {
  code: 'mk',
  prevText: 'претходно',
  nextText: 'следно',
  todayText: 'Денес',
  yearText: 'година',
  monthText: 'Месец',
  weekText: 'Недела',
  weekTextShort: 'Сед',
  dayText: 'Ден',
  listText: 'График',
  allDayText: 'Цел ден',
  moreLinkText(n) {
    return '+повеќе ' + n
  },
  noEventsText: 'Нема настани за прикажување',
} as LocaleInput
