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

  // a callback ref's returned cleanup runs instead of the ref being called with null (React 19's
  // contract, honored in both runtimes)
  it('runs a Scroller callback ref\'s cleanup on unmount', async () => {
    let calls: string[] = []

    function CleanupBody() {
      return createElement('div', { style: { height: '100px' } },
        createElement(Scroller, {
          vertical: true,
          ref: (handle) => {
            calls.push(handle ? 'attach' : 'null')
            return () => {
              calls.push('cleanup')
            }
          },
        }),
      )
    }

    let calendar = initCalendar({
      plugins: DEFAULT_PLUGINS,
      views: { probe: createViewComponent(CleanupBody) as any },
      initialView: 'probe',
    })
    await waitTimeout()
    calendar.destroy()
    await waitTimeout()

    expect(calls[0]).toBe('attach')
    expect(calls).not.toContain('null')
    expect(calls[calls.length - 1]).toBe('cleanup')
  })
})
