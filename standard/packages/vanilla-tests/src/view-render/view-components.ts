import { createElement } from 'fullcalendar/preact'
import { Scroller, createViewComponent } from 'fullcalendar/protected-api'
import { DEFAULT_PLUGINS } from '../lib/global-plugins'
import { waitTimeout } from '../lib/misc'

/*
View components from createViewComponent (what the built-in views are), given to `views` directly, and the
Scroller's ref as early as its class had it
*/
describe('view components', () => {
  let rootRefSawScroller: boolean[]

  // an enclosing element's ref callback sees the Scroller's handle already (it attaches when the
  // Scroller's own element does)
  function ProbeBody() {
    let scrollerRef = { current: null }

    return createElement('div', {
      className: 'probe-body',
      style: { height: '100px' },
      ref: (el) => {
        if (el) {
          rootRefSawScroller.push(Boolean(scrollerRef.current && scrollerRef.current.listener))
        }
      },
    }, createElement(Scroller, { vertical: true, ref: scrollerRef }, createElement('div', null, 'content')))
  }

  beforeEach(() => {
    rootRefSawScroller = []
  })

  it('renders a view component given as a view directly', async () => {
    let calendar = initCalendar({
      plugins: DEFAULT_PLUGINS,
      views: { probe: createViewComponent(ProbeBody) as any }, // typed as options only, but a component works
      initialView: 'probe',
    })
    await waitTimeout()

    expect(calendar.el.querySelectorAll('.probe-body').length).toBe(1)
    expect(rootRefSawScroller).toEqual([true])
  })
})
