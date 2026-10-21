import { DEFAULT_PLUGINS } from '../lib/global-plugins'
import { waitTimeout } from '../lib/misc'

/*
A button's options from a plugin (a theme, say) and the user's combine like top-level options: classes
join, iconContent falls back to the plugin's when the user's returns `true`, didMount/willUnmount both
run, and the rest is the user's
*/
describe('per-button options merging', () => {
  let calls: string[]

  const pluginButtons = {
    today: {
      class: () => {
        calls.push('plugin class')
        return 'plugin-class'
      },
      didMount: () => {
        calls.push('plugin didMount')
      },
      willUnmount: () => {
        calls.push('plugin willUnmount')
      },
      text: 'Plugin text',
    },
  }

  const userClass = () => {
    calls.push('user class')
    return 'user-class'
  }
  const userDidMount = () => {
    calls.push('user didMount')
  }
  const userWillUnmount = () => {
    calls.push('user willUnmount')
  }

  function buildUserButtons() { // a new object each time, with the same functions
    return {
      today: { class: userClass, didMount: userDidMount, willUnmount: userWillUnmount, text: 'User text' },
    }
  }

  pushOptions({
    plugins: [...DEFAULT_PLUGINS, { name: 'button-defaults', optionDefaults: { buttons: pluginButtons } }],
    initialView: 'dayGridMonth',
    headerToolbar: { start: 'today', center: '', end: '' },
  })

  beforeEach(() => {
    calls = []
  })

  function getTodayButtonEl(calendar): HTMLElement {
    return calendar.el.querySelector('button.plugin-class, button.user-class') as HTMLElement
  }

  it('joins classes, runs both lifecycle callbacks, and takes the user\'s text', async () => {
    let calendar = initCalendar({ buttons: buildUserButtons() })
    await waitTimeout()

    let buttonEl = getTodayButtonEl(calendar)
    expect(buttonEl.classList.contains('plugin-class')).toBe(true)
    expect(buttonEl.classList.contains('user-class')).toBe(true)
    expect(buttonEl.textContent).toBe('User text')
    expect(calls.filter((call) => /didMount/.test(call))).toEqual(['plugin didMount', 'user didMount'])

    calls = []
    calendar.setOption('headerToolbar', { start: '', center: '', end: '' })
    await waitTimeout()
    expect(calls).toEqual(['plugin willUnmount', 'user willUnmount'])
  })

  // the user's own layers (initial options, setOption) replace a button's options, as before
  it('replaces the user\'s earlier button options on setOption, keeping the plugin\'s', async () => {
    let calendar = initCalendar({ buttons: { today: { class: 'user-a' } } })
    await waitTimeout()

    calendar.setOption('buttons', { today: { class: 'user-b' } })
    await waitTimeout()

    let buttonEl = getTodayButtonEl(calendar)
    expect(buttonEl.classList.contains('plugin-class')).toBe(true)
    expect(buttonEl.classList.contains('user-b')).toBe(true)
    expect(buttonEl.classList.contains('user-a')).toBe(false)
  })

  it('treats an equal new buttons object as unchanged', async () => {
    let calendar = initCalendar({ buttons: buildUserButtons() })
    await waitTimeout()

    calls = []
    calendar.setOption('buttons', buildUserButtons())
    await waitTimeout()
    expect(calls).toEqual([])
  })
})
