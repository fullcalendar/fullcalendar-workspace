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
NOTE: this can be a public API, especially createElement for hooks.
See examples/typescript-scheduler/src/index.ts
*/

/*
HACK for flushSync being a noop:
https://github.com/preactjs/preact/issues/3929
*/
export function flushSync(renderActionToFlush) {
  renderActionToFlush()

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

/*
Triggers a state-change which unclogs the render queue? Needed?
*/
class FakeComponent extends preact.Component {
  render() { return preact.createElement('div', {}) }
  componentDidMount() { this.setState({}) }
}

export const createContext = preact.createContext

export const preactOptions = preact.options
