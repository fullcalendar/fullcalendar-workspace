import { Calendar } from 'fullcalendar'
import luxonPlugin from '@fullcalendar/format-luxon3'
import dayGridPlugin from 'fullcalendar/daygrid'
import classicThemePlugin from 'fullcalendar/themes/classic' // need both
import themeForTestsPlugin from '../lib/theme-for-tests.js' // "
import timeGridPlugin from 'fullcalendar/timegrid'
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'

describe('luxon formatting plugin', () => {
  const PLUGINS = [ // for `new Calendar`
    luxonPlugin,
    dayGridPlugin,
    timeGridPlugin,
    classicThemePlugin,
    themeForTestsPlugin,
  ]

  pushOptions({ // for initCalendar
    plugins: PLUGINS,
  })

  describe('date formatting', () => {
    it('produces event time text', () => {
      let calendar = initCalendar({
        initialView: 'dayGridMonth',
        now: '2018-09-06',
        displayEventEnd: false,
        eventTimeFormat: 'HH:mm:ss\'abc\'',
        events: [
          { title: 'my event', start: '2018-09-06T13:30:20' },
        ],
      })

      let calendarWrapper = new CalendarWrapper(calendar)
      let eventEl = calendarWrapper.getFirstEventEl()
      let eventInfo = calendarWrapper.getEventElInfo(eventEl)

      expect(eventInfo.timeText).toBe('13:30:20abc')
    })
  })

  describe('range formatting', () => {
    it('renders with same month', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
      })
      let s

      s = calendar.formatRange('2018-09-03', '2018-09-05', 'MMMM {d}, yyyy \'asdf\'')
      expect(s).toEqual('September 3 - 5, 2018 asdf')

      s = calendar.formatRange('2018-09-03', '2018-09-05', '{d} MMMM, yyyy \'asdf\'')
      expect(s).toEqual('3 - 5 September, 2018 asdf')
    })

    it('renders with same year but different month', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
      })
      let s

      s = calendar.formatRange('2018-09-03', '2018-10-05', '{MMMM {d}}, yyyy \'asdf\'')
      expect(s).toEqual('September 3 - October 5, 2018 asdf')

      s = calendar.formatRange('2018-09-03', '2018-10-05', '{{d} MMMM}, yyyy \'asdf\'')
      expect(s).toEqual('3 September - 5 October, 2018 asdf')
    })

    it('renders with different years', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
      })
      let s

      s = calendar.formatRange('2018-09-03', '2019-10-05', '{MMMM {d}}, yyyy \'asdf\'')
      expect(s).toEqual('September 3, 2018 asdf - October 5, 2019 asdf')

      s = calendar.formatRange('2018-09-03', '2019-10-05', '{{d} MMMM}, yyyy \'asdf\'')
      expect(s).toEqual('3 September, 2018 asdf - 5 October, 2019 asdf')
    })

    it('renders the same if same day', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
      })
      let s

      s = calendar.formatRange('2018-09-03T00:00:00', '2018-09-03T23:59:59', 'MMMM d yyyy')
      expect(s).toEqual('September 3 2018')
    })

    it('inherits defaultRangeSeparator', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
        defaultRangeSeparator: ' to ',
      })
      let s = calendar.formatRange('2018-09-03', '2018-09-05', 'MMMM d, yyyy \'asdf\'')
      expect(s).toEqual('September 3, 2018 asdf to September 5, 2018 asdf')
    })

    it('produces title with titleRangeSeparator', () => {
      initCalendar({ // need to render the calendar to get view.title :(
        plugins: PLUGINS,
        initialView: 'dayGridWeek',
        now: '2018-09-06',
        titleFormat: 'MMMM {d} yy \'yup\'',
        titleRangeSeparator: ' to ',
      })
      expect(currentCalendar.view.title).toBe('September 2 to 8 18 yup')
    })
  })
})
