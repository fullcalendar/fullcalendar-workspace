import * as preact from 'preact'
export * from 'preact'
export { createPortal } from 'preact/compat'

/*
Shim newer TS global libs
https://github.com/preactjs/preact/issues/4023
*/
declare global {
  interface PictureInPictureEvent extends Event {
  }
  interface PictureInPictureEventInit extends EventInit {
  }
}

/*
Like flushSync, but flushes ALL pending updates, not only those initiated in a callback
BTW, flushSync doesn't work in Preact: https://github.com/preactjs/preact/issues/3929
*/
export function flushUpdates() {
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

export function flushSync(f: () => void): void {
  f()
  flushUpdates()
}

/*
Triggers a state-change which unclogs the render queue? Needed?
*/
class FakeComponent extends preact.Component {
  render() { return preact.createElement('div', {}) }
  componentDidMount() { this.setState({}) }
}

export const createContext = preact.createContext

export const preactOptions = preact.options
