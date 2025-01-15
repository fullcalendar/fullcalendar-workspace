import { LocaleInput } from '../index.js'

export default {
  code: 'eu',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 7, // The week that contains Jan 1st is the first week of the year.
  },
  buttonText: {
    prev: 'Aur',
    next: 'Hur',
    today: 'Gaur',
    year: 'Urtea',
    month: 'Hilabetea',
    week: 'Astea',
    day: 'Eguna',
    list: 'Agenda',
  },
  weekText: 'As',
  allDayText: 'Egun\nosoa',
  moreLinkText: 'gehiago',
  noEventsText: 'Ez dago ekitaldirik erakusteko',
} as LocaleInput
