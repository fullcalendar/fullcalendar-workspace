import * as preact from 'preact'

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

export type CSSProperties = preact.JSX.CSSProperties

export {
  type VNode,
  type ComponentType,
  type ComponentChild,
  type ComponentChildren,
  type Context,
  type Ref,
  type RefObject,
  Component,
  createElement,
  createContext,
  createRef,
  Fragment,
  isValidElement,
  FunctionalComponent,
} from 'preact'

export {
  createPortal,
} from 'preact/compat'

export {
  createRoot
} from 'preact/compat/client'
