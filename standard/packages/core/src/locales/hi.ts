import { LocaleInput } from '../index.js'

export default {
  code: 'hi',
  week: {
    dow: 0, // Sunday is the first day of the week.
    doy: 6, // The week that contains Jan 1st is the first week of the year.
  },
  prevText: 'पिछला',
  nextText: 'अगला',
  todayText: 'आज',
  yearText: 'वर्ष',
  monthText: 'महीना',
  weekText: 'सप्ताह',
  weekTextShort: 'हफ्ता',
  dayText: 'दिन',
  listText: 'कार्यसूची',
  allDayText: 'सभी दिन',
  moreLinkText(n) {
    return '+अधिक ' + n
  },
  noEventsText: 'कोई घटनाओं को प्रदर्शित करने के लिए',
} as LocaleInput
