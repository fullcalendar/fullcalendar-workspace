
UI-DEFAULT(VANILLA-JS)
/theming/theme-*/src/index.ts --- plugin
/theming/theme-*/src/_gen/css-tailwind/index.ts --- compiled. unused interum
(use AI to simultaneously fctw- prefix and externalize)
(write script to obfuscate all fctw- classnames)
(convert rem -> em, add our reset)
/theming/theme-*/src/_gen/css-vanilla/index.ts --- plugin. does NOT import .css file
/theming/theme-*/src/_gen/css-vanilla/global.css --- where above fctw- stuff dumped css
/theming/theme-*/src/_gen/css-vanilla/global.ts --- copied and pasted, just globally installs plugin
/theming/theme-*/dist/index.(js|d.ts) and global.(js|d.ts|css)

UI-DEFAULT(REACT) --- private package
/theming/ui-default-react/src/theme-*/(event-calendar|scheduler).tsx
/theming/ui-default-react/src/_gen/theme-*/css-tailwind/(event-calendar|scheduler).tsx --- compiled
--- no "dist" because React users can just use vanilla-js plugin

MUI-MATERIAL
/theming/ui-mui-material/src/theme-*/(EventCalendar|Scheduler).tsx
/theming/ui-mui-material/src/_gen/theme-*/css-tailwind/(EventCalendar|Scheduler).tsx --- compiled
(use AI to simultaneously fctw- prefix and externalize)
(write script to obfuscate all fctw- classnames)
(convert rem -> em, add our reset)
/theming/ui-mui-material/src/_gen/theme-*/css-vanilla/(EventCalendar|Scheduler).tsx
/theming/ui-mui-material/src/_gen/theme-*/css-vanilla/global.css --- where above fctw- stuff dumped css
/theming/ui-mui-material/dist/(EventCalendar|Scheduler).(js|d.ts) and global.css

SHADCN --- private package
/theming/ui-shadcn/src/theme-*/(event-calendar|scheduler).tsx
/theming/ui-shadcn/src/_gen/theme-*/(event-calendar|scheduler).tsx --- assumed tailwind. compiled
--- no "dist" because Shadcn is ALWAYS copy and paste


create demo-vanilla-js, pull from plugins
have demo-react pull from css-vanilla AND *compiled* css-tailwind
have both demos test RTL with toggle
