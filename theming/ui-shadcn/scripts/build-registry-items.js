import { fileURLToPath } from 'node:url'
import { dirname, join as joinPaths } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkgDir = joinPaths(__dirname, '..')

const themes = ['breezy', 'classic', 'forma', 'monarch', 'pulse']
const relativeImportReplacements = {
  '../../ui/button.js': '@/components/ui/button',
  '../../ui/tabs.js': '@/components/ui/tabs',
  '../../lib/utils.js': '@/lib/utils',
  './event-calendar.js': './event-calendar.tsx',
}

for (const theme of themes) {
  await mkdir(joinPaths(pkgDir, 'registry-dist', theme), { recursive: true })
  await writeEventCalendarConfig(theme)
  await writeSchedulerConfig(theme)
}

async function writeEventCalendarConfig(theme) {
  const themeTitle = capitalizeFirstLetter(theme)
  const config = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "event-calendar",
    "title": `EventCalendar (${themeTitle})`,
    "description": `A standard event calendar in the ${themeTitle} theme-flavor`,
    "dependencies": [
      "@fullcalendar/react",
      "@fullcalendar/core",
      "@fullcalendar/interaction",
      "@fullcalendar/daygrid",
      "@fullcalendar/timegrid",
      "@fullcalendar/list",
      "@fullcalendar/multimonth",
      "lucide-react"
    ],
    "registryDependencies": [
      "button",
      "tabs"
    ],
    "files": [
      {
        "path": "src/registry/default/ui/event-calendar.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'event-calendar.tsx'),
            'utf-8',
          ),
        ),
        "type": "registry:ui"
      }
    ],
    "type": "registry:ui"
  }
  await writeFile(
    joinPaths(pkgDir, 'registry-dist', theme, 'event-calendar.json'),
    JSON.stringify(config, undefined, 2),
    'utf-8',
  )
}

async function writeSchedulerConfig(theme) {
  const themeTitle = capitalizeFirstLetter(theme)
  const config = {
    "$schema": "https://ui.shadcn.com/schema/registry-item.json",
    "name": "scheduler",
    "title": `Scheduler (${themeTitle})`,
    "description": `A premium event scheduler in the ${themeTitle} theme-flavor`,
    "dependencies": [
      "@fullcalendar/react",
      "@fullcalendar/core",
      "@fullcalendar/adaptive",
      "@fullcalendar/scrollgrid",
      "@fullcalendar/timeline",
      "@fullcalendar/resource",
      "@fullcalendar/resource-timeline",
      "@fullcalendar/resource-daygrid",
      "@fullcalendar/resource-timegrid",
      "lucide-react"
    ],
    "registryDependencies": [
      `@fullcalendar/${theme}/event-calendar`
    ],
    "files": [
      {
        "path": "src/registry/default/ui/scheduler.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'scheduler.tsx'),
            'utf-8',
          ),
        ),
        "type": "registry:ui"
      }
    ],
    "type": "registry:ui"
  }
  await writeFile(
    joinPaths(pkgDir, 'registry-dist', theme, 'scheduler.json'),
    JSON.stringify(config, undefined, 2),
    'utf-8',
  )
}

function transformSrcCode(code) {
  return code.replace(
    /import React from ['"]react['"];?\n/mg,
    '',
  ).replace(
    /(from\s+['"])(\.[^'"]+)(['"])/g,
    (whole, pre, importPath, post) => {
      const replacement = relativeImportReplacements[importPath]
      if (replacement) {
        return pre + replacement + post
      }
      return whole
    }
  )
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
