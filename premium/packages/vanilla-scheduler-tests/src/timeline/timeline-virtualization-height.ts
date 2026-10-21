import { ignoreResizeObserverLoops, waitTimeout } from '@fullcalendar-tests/standard/lib/misc'
import { ResourceTimelineViewWrapper } from '../lib/wrappers/ResourceTimelineViewWrapper'

/*
With virtualization, the rendered rows must cover the body after the height option changes from auto
(where the window scrolls the rows) to a number (where the body scroller does)
*/
describe('timeline virtualization across a height change', () => {
  // a height:auto timeline with many rows gives a ResizeObserver loop, as it did before the hooks
  it('renders rows down to the bottom of the body', () => ignoreResizeObserverLoops(async () => {
    let resources = []

    for (let i = 0; i < 100; i++) {
      resources.push({ id: `r${String(i).padStart(3, '0')}`, title: `Resource ${i}` })
    }

    let calendar = initCalendar({
      initialView: 'resourceTimelineDay',
      initialDate: '2024-01-03',
      virtualization: true,
      height: 'auto',
      resources,
    })
    await waitTimeout(200)

    calendar.setOption('height', 3000) // taller than the window, which sized the rows before
    await waitTimeout(300)

    let viewWrapper = new ResourceTimelineViewWrapper(calendar)
    let scrollerRect = viewWrapper.getDataGridBodyEl().getBoundingClientRect()
    let lowestBottom = Math.max(
      ...viewWrapper.dataGrid.getResourceCellEls(null).map((cellEl) => cellEl.getBoundingClientRect().bottom),
    )

    expect(lowestBottom).toBeGreaterThanOrEqual(scrollerRect.bottom - 1)
  }))
})
