import { LocaleInput } from '../index.js'

export default {
  code: 'ka',
  week: {
    dow: 1,
    doy: 7,
  },
  prevText: 'წინა',
  nextText: 'შემდეგი',
  todayText: 'დღეს',
  yearText: 'წელიწადი',
  monthText: 'თვე',
  weekText: 'კვირა',
  weekTextShort: 'კვ',
  dayText: 'დღე',
  listText: 'დღის წესრიგი',
  allDayText: 'მთელი\nდღე',
  moreLinkText(n) {
    return '+ კიდევ ' + n
  },
  noEventsText: 'ღონისძიებები არ არის',
} as LocaleInput
