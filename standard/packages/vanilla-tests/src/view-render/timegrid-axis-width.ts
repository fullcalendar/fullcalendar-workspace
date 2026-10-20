import { waitTimeout } from '../lib/misc'

describe('timeGrid axis width', () => {
  pushOptions({
    initialView: 'timeGridWeek',
    initialDate: '2024-01-03',
  })

  // the label's height used to count toward the axis width (planning/hook-toolkit-spec.md §9)
  it('is not widened by a tall week-number label', async () => {
    let weekNumberEl: HTMLElement
    initCalendar({
      weekNumbers: true,
      weekNumberHeaderContent: { html: '<div style="width:4px;height:300px"></div>' },
      weekNumberHeaderDidMount(info) {
        weekNumberEl = info.el
      },
    })
    await waitTimeout()

    expect(weekNumberEl.getBoundingClientRect().width).toBeLessThan(150)
  })
})
