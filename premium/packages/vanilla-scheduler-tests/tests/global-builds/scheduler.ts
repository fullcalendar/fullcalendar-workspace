import { beforeAll, describe, expect, it } from 'vitest'
import { appendTestElement } from '@fullcalendar-tests/standard/tests/lib/calendar'
import { getGlobalFullCalendar, loadScript } from '@fullcalendar-tests/standard/tests/lib/global-build'

describe('scheduler global build', () => {
  beforeAll(async () => {
    await loadScript(new URL('../../node_modules/fullcalendar/all/global.js', import.meta.url))
    await loadScript(new URL('../../node_modules/fullcalendar-scheduler/all/global.js', import.meta.url))
  })

  it('renders a resource timeline', async () => {
    const FullCalendar = getGlobalFullCalendar()
    const el = appendTestElement(document.createElement('div'))
    const calendar = new FullCalendar.Calendar(el, {
      schedulerLicenseKey: 'AGPL-My-Frontend-And-Backend-Are-Open-Source',
      initialView: 'resourceTimelineDay',
      resources: [{ id: 'a', title: 'Resource A' }],
    })
    calendar.render()

    // the global build has its own settle tracker, which waitForSettle() can't see
    await expect.poll(() => el.textContent).toContain('Resource A')
    calendar.destroy()
  })
})
