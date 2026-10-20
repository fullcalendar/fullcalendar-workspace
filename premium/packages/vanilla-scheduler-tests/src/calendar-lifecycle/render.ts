import { describe, expect, it, onTestFinished } from 'vitest'
import { Calendar } from 'fullcalendar'
import { config } from 'fullcalendar/protected-api'
import { initCalendar } from '@fullcalendar-tests/standard/src/lib/calendar'
import { getEventEls, getEventIdOfEl } from '@fullcalendar-tests/standard/src/lib/models/events'
import { waitForSettle } from '@fullcalendar-tests/standard/src/lib/settle'

describe('render', () => {
  const options = {
    initialView: 'resourceTimelineDay',
    resources: [{ id: 'a', title: 'A' }],
  }

  it('shows no license warning with the test suite\'s preset key', () => {
    const calendar = initCalendar(options)
    expect(calendar.el.querySelector('[data-fc-part~="resourceRow"]')).not.toBeNull()
    expect(calendar.el.textContent).not.toContain('license key')
  })

  it('shows a license warning with an invalid key', () => {
    const calendar = initCalendar({ ...options, schedulerLicenseKey: 'invalid' })
    expect(calendar.el.textContent).toContain('Your license key is invalid.')
  })

  it('switches between resource and non-resource views', async () => {
    const calendar = initCalendar({
      now: '2016-01-07',
      editable: true,
      scrollTime: '00:00',
      initialView: 'resourceTimelineDay',
      views: {
        resourceTimelineThreeDays: { type: 'resourceTimeline', duration: { days: 3 } },
        resourceTimeGridTwoDay: { type: 'resourceTimeGrid', duration: { days: 2 } },
      },
      resourceColumnHeaderContent: 'Rooms',
      resources: [
        { id: 'a', title: 'Auditorium A' },
        { id: 'b', title: 'Auditorium B', eventColor: 'green' },
        { id: 'c', title: 'Auditorium C', eventColor: 'orange' },
      ],
      events: [
        { id: '1', resourceId: 'a', start: '2016-01-07T02:00:00', end: '2016-01-07T07:00:00', title: 'event 1' },
        { id: '2', resourceId: 'b', start: '2016-01-07T05:00:00', end: '2016-01-07T22:00:00', title: 'event 2' },
        { id: '3', resourceId: 'c', start: '2016-01-06', end: '2016-01-08', title: 'event 3' },
      ],
    })
    await waitForSettle()
    const renderedEventIds = () => [...new Set(getEventEls(calendar.el).map(getEventIdOfEl))].sort()

    for (const view of [
      'resourceTimelineThreeDays',
      'resourceTimeGridDay',
      'resourceTimeGridTwoDay',
      'timeGridWeek',
      'dayGridMonth',
      'resourceTimelineDay',
    ]) {
      calendar.changeView(view)
      await waitForSettle()

      expect(calendar.view.type).toBe(view)
      expect(renderedEventIds()).toEqual(['1', '2', '3'])
    }
  })

  describe('schedulerLicenseKey', () => {
    function useMockReleaseDate() {
      config.mockSchedulerReleaseDate = new Date('2011-06-06')
      onTestFinished(() => {
        delete config.mockSchedulerReleaseDate
      })
    }

    function getLicenseMessages(calendar: Calendar): string[] {
      return Array.from(calendar.el.querySelectorAll('a[href*="schedulerLicenseKey"]'))
        .map((linkEl) => linkEl.parentElement!.textContent!)
    }

    it.each([
      ['garbage', '<%= someCrapText %>', ['Your license key is invalid. More info']],
      ['a key purchased over a year before the release', '1234567890-fcs-1273017600', ['Your license key is too old to work with this version. More info']], // 2010-05-05
      ['a key purchased within a year of the release', '1234567890-fcs-1275868800', []], // 2010-06-07
      ['a key with a 9-digit id', '123456789-fcs-1275868800', ['Your license key is invalid. More info']],
      ['the Creative Commons key', 'CC-Attribution-NonCommercial-NoDerivatives', []],
      ['the AGPL key', 'AGPL-My-Frontend-And-Backend-Are-Open-Source', []],
    ])('with %s, shows %j', (_desc, schedulerLicenseKey, expectedMessages) => {
      useMockReleaseDate()
      const calendar = initCalendar({ ...options, schedulerLicenseKey })

      expect(getLicenseMessages(calendar)).toEqual(expectedMessages)
    })

    it.each(['timelineDay', 'dayGridMonth'])('also checks the key in %s, a view without resources', (initialView) => {
      useMockReleaseDate()
      const calendar = initCalendar({ initialView, schedulerLicenseKey: '<%= someCrapText %>' })

      expect(getLicenseMessages(calendar)).toEqual(['Your license key is invalid. More info'])
    })

    it.each(['resourceTimelineDay', 'resourceTimeGridDay', 'resourceDayGridDay'])('shows one message after rerendering %s', async (initialView) => {
      useMockReleaseDate()
      const calendar = initCalendar({ ...options, initialView, schedulerLicenseKey: '1234567890-fcs-1273017600' })
      expect(getLicenseMessages(calendar)).toHaveLength(1)

      calendar.next()
      await waitForSettle()

      expect(getLicenseMessages(calendar)).toHaveLength(1)
    })
  })
})
