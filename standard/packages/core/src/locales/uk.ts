import { LocaleInput } from '../index.js'

export default {
  code: 'uk',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 7, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: 'Попередній',
    next: 'далі',
    today: 'Сьогодні',
    year: 'рік',
    month: 'Місяць',
    week: 'Тиждень',
    day: 'День',
    list: 'Порядок денний',
  },
  weekText: 'Тиж',
  allDayText: 'Увесь\nдень',
  moreLinkText(n) {
    return '+ще ' + n + '...'
  },
  noEventsText: 'Немає подій для відображення',
} as LocaleInput
