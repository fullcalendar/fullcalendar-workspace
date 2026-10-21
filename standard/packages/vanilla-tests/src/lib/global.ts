
// NOTE: there are many jquery-related libs that our karma config implicitly includes
// They were being difficult with CJS/ESM

/* STYLES */
import 'fullcalendar/skeleton.css'
import 'fullcalendar/themes/classic/theme.css'
import 'fullcalendar/themes/classic/palette.css'
// import './global.css' -- was erroring -- imported in index.js.tpl instead

import './global-utils.js'
import './global-plugins.js'

/*
Browsers report a ResizeObserver callback that changes the layout it observes as an uncaught error
("ResizeObserver loop completed with undelivered notifications"). It's benign: the layout settles on the
next frame. Vitest's config filters it too. Jasmine installs its window.onerror when the run starts, so
this wraps it then (a top-level beforeAll), and no spec fails for one, whichever spec triggered it
*/
beforeAll(() => {
  const jasmineOnError = window.onerror

  window.onerror = (message, ...args) => {
    if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
      return true
    }
    return jasmineOnError ? jasmineOnError(message, ...args) : false
  }
})
