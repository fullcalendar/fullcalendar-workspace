import { describe, expect, it } from 'vitest'
import { initCalendar } from '@fullcalendar-tests/standard/tests/lib/calendar'

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
})
