import * as preact from 'preact'

export const strictModeFactor = 1

/*
Like flushSync, but flushes ALL pending updates, not only those initiated in a callback
BTW, flushSync doesn't work in Preact: https://github.com/preactjs/preact/issues/3929
*/
export function flushUpdates(): void {
  let oldDebounceRendering = preact.options.debounceRendering // orig
  let callbackQ = []

  function execCallbackSync(callback) {
    callbackQ.push(callback)
  }

  preact.options.debounceRendering = execCallbackSync
  preact.render(preact.createElement(FakeComponent, {}), document.createElement('div'))

  while (callbackQ.length) {
    callbackQ.shift()()
  }

  preact.options.debounceRendering = oldDebounceRendering
}

export function flushSync<R>(f: () => R): R {
  const res = f()
  flushUpdates()
  return res
}

/*
Triggers a state-change which unclogs the render queue? Needed?
*/
class FakeComponent extends preact.Component {
  render() { return preact.createElement('div', {}) }
  componentDidMount() { this.setState({}) }
}

// HACK
// for ResizeObserver fallback
export const preactOptions: any = preact.options
