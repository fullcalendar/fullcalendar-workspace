import { LocaleInput } from '../index.js'

export default {
  code: 'ru',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  prevText: 'Пред',
  nextText: 'След',
  todayText: 'Сегодня',
  yearText: 'Год',
  monthText: 'Месяц',
  weekText: 'Неделя',
  weekTextShort: 'Нед',
  dayText: 'День',
  listText: 'Повестка дня',
  allDayText: 'Весь\nдень',
  moreLinkText(n) {
    return '+ ещё ' + n
  },
  noEventsText: 'Нет событий для отображения',
} as LocaleInput
