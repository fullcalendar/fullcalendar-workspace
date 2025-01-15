import { LocaleInput } from '../index.js'

export default {
  code: 'fr-ch',
  week: {
    dow: 1, // Monday is the first day of the week.
    doy: 4, // The week that contains Jan 4th is the first week of the year.
  },
  buttonText: {
    prev: 'Précédent',
    next: 'Suivant',
    today: 'Courant',
    year: 'Année',
    month: 'Mois',
    week: 'Semaine',
    day: 'Jour',
    list: 'Mon planning',
  },
  weekText: 'Sm',
  allDayText: 'Toute la\njournée',
  moreLinkText: 'en plus',
  noEventsText: 'Aucun évènement à afficher',
} as LocaleInput
