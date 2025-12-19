
// NOTE: there are many jquery-related libs that our karma config implicitly includes
// They were being difficult with CJS/ESM

/* STYLES */
import '@fullcalendar/core/skeleton.css'
import '@fullcalendar/theme-classic/theme.css'
import '@fullcalendar/theme-classic/palette.css'
// import './global.css' -- was erroring -- imported in index.js.tpl instead

import './global-utils.js'
import './global-plugins.js'
