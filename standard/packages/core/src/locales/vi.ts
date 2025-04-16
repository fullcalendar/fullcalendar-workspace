import { LocaleInput } from '../index.js'

export default {
  code: 'vi',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  prevText: 'Trước',
  nextText: 'Tiếp',
  todayText: 'Hôm nay',
  yearText: 'Năm',
  monthText: 'Tháng',
  weekText: 'Tuần',
  weekTextShort: 'Tu',
  dayText: 'Ngày',
  listText: 'Lịch biểu',
  allDayText: 'Cả ngày',
  moreLinkText(n) {
    return '+ thêm ' + n
  },
  noEventsText: 'Không có sự kiện để hiển thị',
} as LocaleInput
