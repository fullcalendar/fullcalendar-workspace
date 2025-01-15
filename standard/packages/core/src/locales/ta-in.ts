import { LocaleInput } from '../index.js'

export default {
  code: 'ta-in',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: 'முந்தைய',
    next: 'அடுத்தது',
    today: 'இன்று',
    year: 'ஆண்டு',
    month: 'மாதம்',
    week: 'வாரம்',
    day: 'நாள்',
    list: 'தினசரி அட்டவணை',
  },
  weekText: 'வாரம்',
  allDayText: 'நாள்\nமுழுவதும்',
  moreLinkText(n) {
    return '+ மேலும் ' + n
  },
  noEventsText: 'காண்பிக்க நிகழ்வுகள் இல்லை',
} as LocaleInput
