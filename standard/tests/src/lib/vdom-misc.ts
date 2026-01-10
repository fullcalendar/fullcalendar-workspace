import { createRoot, createElement, flushSync } from '@fullcalendar/core/preact'
import { ListenerCounter } from './ListenerCounter.js'

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
