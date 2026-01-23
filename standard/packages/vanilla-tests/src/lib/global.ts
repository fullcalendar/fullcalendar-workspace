
// NOTE: there are many jquery-related libs that our karma config implicitly includes
// They were being difficult with CJS/ESM

/* STYLES */
import '@fullcalendar/vanilla/skeleton.css'
import '@fullcalendar/vanilla/themes/classic/theme.css'
import '@fullcalendar/vanilla/themes/classic/palette.css'
// import './global.css' -- was erroring -- imported in index.js.tpl instead

import './global-utils.js'
import './global-plugins.js'
