import { Calendar } from 'fullcalendar'
import momentPlugin from '@fullcalendar/format-moment'
import classicThemePlugin from 'fullcalendar/themes/classic' // need both
import themeForTestsPlugin from '../lib/theme-for-tests.js' // "
import dayGridPlugin from 'fullcalendar/daygrid'
import timeGridPlugin from 'fullcalendar/timegrid'
import 'moment/locale/es' // only test spanish
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'
import { TimeGridViewWrapper } from '../lib/wrappers/TimeGridViewWrapper.js'

describe('moment formatting plugin', () => {
  const PLUGINS = [classicThemePlugin, themeForTestsPlugin, dayGridPlugin, timeGridPlugin, momentPlugin]
  pushOptions({ plugins: PLUGINS })

  describe('date formatting', () => {
    it('produces event time text', () => {
      let calendar = initCalendar({
        initialView: 'dayGridMonth',
        now: '2018-09-06',
        displayEventEnd: false,
        eventTimeFormat: 'HH:mm:ss[!]',
        events: [
          { title: 'my event', start: '2018-09-06T13:30:20' },
        ],
      })

      let calendarWrapper = new CalendarWrapper(calendar)
      let eventEl = calendarWrapper.getFirstEventEl()
      let eventInfo = calendarWrapper.getEventElInfo(eventEl)

      expect(eventInfo.timeText).toBe('13:30:20!')
    })
  })

  describe('range formatting', () => {
    it('renders with same month', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
      })
      let s

      s = calendar.formatRange('2018-09-03', '2018-09-05', 'MMMM {D}, YYYY [nice]')
      expect(s).toEqual('September 3 - 5, 2018 nice')

      s = calendar.formatRange('2018-09-03', '2018-09-05', '{D} MMMM, YYYY [nice]')
      expect(s).toEqual('3 - 5 September, 2018 nice')
    })

    it('renders with same year but different month', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
      })
      let s

      s = calendar.formatRange('2018-09-03', '2018-10-05', '{MMMM {D}}, YYYY [nice]')
      expect(s).toEqual('September 3 - October 5, 2018 nice')

      s = calendar.formatRange('2018-09-03', '2018-10-05', '{{D} MMMM}, YYYY [nice]')
      expect(s).toEqual('3 September - 5 October, 2018 nice')
    })

    it('renders with different years', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
      })
      let s

      s = calendar.formatRange('2018-09-03', '2019-10-05', '{MMMM {D}}, YYYY [nice]')
      expect(s).toEqual('September 3, 2018 nice - October 5, 2019 nice')

      s = calendar.formatRange('2018-09-03', '2019-10-05', '{{D} MMMM}, YYYY [nice]')
      expect(s).toEqual('3 September, 2018 nice - 5 October, 2019 nice')
    })

    it('renders the same if same day', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
      })
      let s

      s = calendar.formatRange('2018-09-03T00:00:00', '2018-09-03T23:59:59', 'MMM Do YY')
      expect(s).toEqual('Sep 3rd 18')
    })

    it('inherits defaultRangeSeparator', () => {
      let calendar = new Calendar(document.createElement('div'), {
        plugins: PLUGINS,
        defaultRangeSeparator: ' to ',
      })
      let s = calendar.formatRange('2018-09-03', '2018-09-05', 'MMMM D, YYYY [nice]')
      expect(s).toEqual('September 3, 2018 nice to September 5, 2018 nice')
    })

    it('produces title with titleRangeSeparator', () => {
      initCalendar({ // need to render the calendar to get view.title :(
        initialView: 'dayGridWeek',
        now: '2018-09-06',
        titleFormat: 'MMMM {D} YY [yup]',
        titleRangeSeparator: ' to ',
      })
      expect(currentCalendar.view.title).toBe('September 2 to 8 18 yup')
    })

    // https://github.com/fullcalendar/fullcalendar/issues/5493
    it('displays correct rangeSeparator on events', () => {
      let calendar = initCalendar({
        initialView: 'timeGridDay',
        initialDate: '2020-06-26',
        scrollTime: '00:00',
        eventTimeFormat: 'HH:mm:ss',
        events: [
          { title: 'event', start: '2020-06-26T01:00:00', end: '2020-06-26T02:00:00' },
        ],
      })
      let timeGridWrapper = new TimeGridViewWrapper(calendar).timeGrid
      let timeTexts = timeGridWrapper.getEventTimeTexts()
      expect(timeTexts[0]).toBe('01:00:00 - 02:00:00')
    })
  })
})
