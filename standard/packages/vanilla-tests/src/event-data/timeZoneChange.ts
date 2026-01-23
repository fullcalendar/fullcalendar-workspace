// import { strictModeFactor } from '@fullcalendar/vanilla/protected-api'
// import timeGridPlugin from '@fullcalendar/vanilla/timegrid'
// import luxonPlugin from '@fullcalendar/luxon3'
// import classicThemePlugin from '@fullcalendar/vanilla/themes/classic' // need both
// import themeForTestsPlugin from '../lib/theme-for-tests.js' // "

describe('timeZone change', () => {
  // xdescribe('with non-recurring timed events and luxon plugin', () => {
  //   it('adjusts timed event', () => {
  //     const timeTexts = []
  //     const calendar = initCalendar({
  //       plugins: [timeGridPlugin, luxonPlugin, classicThemePlugin, themeForTestsPlugin],
  //       timeZone: 'America/New_York',
  //       initialView: 'timeGridWeek',
  //       initialDate: '2023-02-07',
  //       events: [
  //         { start: '2023-02-07T12:00:00' },
  //       ],
  //       eventContent(data) {
  //         timeTexts.push(data.timeText)
  //         return true
  //       },
  //     })

  //     let events = calendar.getEvents()
  //     expect(events[0 * strictModeFactor].start).toEqualDate('2023-02-07T17:00:00Z')
  //     expect(timeTexts.length).toBe(1 * strictModeFactor)
  //     expect(timeTexts[0 * strictModeFactor]).toBe('12:00')

  //     calendar.setOption('timeZone', 'America/Chicago')
  //     expect(events[0 * strictModeFactor].start).toEqualDate('2023-02-07T17:00:00Z')
  //     expect(timeTexts.length).toBe(2 * strictModeFactor)
  //     expect(timeTexts[1 * strictModeFactor]).toBe('11:00')
  //   })
  // })
})
