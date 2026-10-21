import * as vdom from 'fullcalendar/preact'
import { createElement as preactCreateElement } from 'preact'
import { flushSync as preactFlushSync } from 'preact/compat'
import { createRoot as preactCreateRoot } from 'preact/compat/client'
import { ListenerCounter } from './ListenerCounter'

// the runtime the calendar renders with: the React build remaps 'fullcalendar/preact' to React, which
// has createRoot. React's root leaves its event listeners on the container, so the count differs
const runtime = vdom as any
const createRoot = runtime.createRoot || preactCreateRoot
const flushSync = runtime.flushSync || preactFlushSync
const createElement = runtime.createRoot ? runtime.createElement : preactCreateElement

let standardElListenerCount

/*
Returns the # of handlers remaining on a DOM node *event after a React-root unmounts*
*/
export function prepareStandardListeners() {
  if (standardElListenerCount === undefined) {
    standardElListenerCount = _prepareStandardListeners()
  }
  return standardElListenerCount
}

function _prepareStandardListeners() {
  let el = document.createElement('div')
  document.body.appendChild(el)

  const elListenerCounter = new ListenerCounter(el)
  elListenerCounter.startWatching()

  const root = createRoot(el)
  flushSync(() => {
    root.render(createElement('div', {}))
  })
  root.unmount()

  return elListenerCounter.stopWatching() // returns # of handlers
}
