import { fileURLToPath } from 'node:url'
import { dirname, join as joinPaths } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkgDir = joinPaths(__dirname, '..')
const demoThemeDir = joinPaths(pkgDir, 'src', 'theme-breezy')

const themes = ['breezy', 'classic', 'forma', 'monarch', 'pulse']
const relativeImportReplacements = {
  '../../ui/button.js': '@/components/ui/button',
  '../../ui/tabs.js': '@/components/ui/tabs',
  '../../lib/utils.js': '@/lib/utils',
  './event-calendar.js': '@/components/event-calendar',
  './event-calendar-toolbar.js': '@/components/event-calendar-toolbar',
  './event-calendar-icons.js': '@/components/event-calendar-icons',
  './event-calendar-container.js': '@/components/ui/event-calendar-container',
  './event-calendar-views.js': '@/components/ui/event-calendar-views',
  './resource-timeline.js': '@/components/resource-timeline',
  './resource-timegrid.js': '@/components/resource-timegrid',
  './scheduler-views.js': '@/components/ui/scheduler-views',
}

for (const theme of themes) {
  await mkdir(joinPaths(pkgDir, 'registry-dist', theme), { recursive: true })

  const themeTitle = capitalizeFirstLetter(theme)
  const eventCalendarConfig = await createEventCalendarConfig(theme, themeTitle)
  const schedulerConfig = await createSchedulerConfig(theme, themeTitle)

  await writeFile(
    joinPaths(pkgDir, 'registry-dist', theme, 'event-calendar.json'),
    JSON.stringify(eventCalendarConfig, undefined, 2),
    'utf-8',
  )
  await writeFile(
    joinPaths(pkgDir, 'registry-dist', theme, 'scheduler.json'),
    JSON.stringify(schedulerConfig, undefined, 2),
    'utf-8',
  )

  // make suitable for registry.json
  delete eventCalendarConfig.$schema
  delete schedulerConfig.$schema
  for (const fileMeta of eventCalendarConfig.files) {
    delete fileMeta.content
  }
  for (const fileMeta of schedulerConfig.files) {
    delete fileMeta.content
  }

  await writeFile(
    joinPaths(pkgDir, 'registry-dist', theme, 'registry.json'),
    JSON.stringify({
      "$schema": "https://ui.shadcn.com/schema/registry.json",
      "name": `fullcalendar-${theme}`,
      "homepage": "https://fullcalendar.io",
      "items": [
        eventCalendarConfig,
        schedulerConfig,
      ],
    }, undefined, 2),
    'utf-8',
  )
}

async function createEventCalendarConfig(theme, themeTitle) {
  return {
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
    "type": "registry:block",
    "files": [
      {
        "type": "registry:block",
        "path": "src/registry/default/blocks/event-calendar-demo.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(demoThemeDir, '_compiled', 'event-calendar-demo.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:component",
        "path": "src/registry/default/components/event-calendar.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'event-calendar.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:component",
        "path": "src/registry/default/components/event-calendar-toolbar.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'event-calendar-toolbar.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:component",
        "path": "src/registry/default/components/event-calendar-icons.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'event-calendar-icons.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:ui",
        "path": "src/registry/default/ui/event-calendar-container.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'event-calendar-container.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:ui",
        "path": "src/registry/default/ui/event-calendar-views.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'event-calendar-views.tsx'),
            'utf-8',
          ),
        ),
      },
    ],
  }

}

async function createSchedulerConfig(theme, themeTitle) {
  return {
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
      `@fullcalendar-${theme}/event-calendar`
    ],
    "type": "registry:block",
    "files": [
      {
        "type": "registry:block",
        "path": "src/registry/default/blocks/resource-timeline-demo.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(demoThemeDir, '_compiled', 'resource-timeline-demo.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:block",
        "path": "src/registry/default/blocks/resource-timegrid-demo.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(demoThemeDir, '_compiled', 'resource-timegrid-demo.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:component",
        "path": "src/registry/default/components/resource-timeline.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'resource-timeline.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:component",
        "path": "src/registry/default/components/resource-timegrid.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'resource-timegrid.tsx'),
            'utf-8',
          ),
        ),
      },
      {
        "type": "registry:ui",
        "path": "src/registry/default/ui/scheduler-views.tsx", // fictional
        "content": transformSrcCode(
          await readFile(
            joinPaths(pkgDir, 'src', `theme-${theme}`, '_compiled', 'scheduler-views.tsx'),
            'utf-8',
          ),
        ),
      }
    ],
  }
}

function transformSrcCode(code) {
  return code.replace(
    /import React from ['"]react['"];?\n/g,
    '',
  ).replace(
    /import React, \{/g,
    'import {',
  ).replace(
    /(from\s+['"])(\.[^'"]+)(['"])/g,
    (whole, pre, importPath, post) => {
      const replacement = relativeImportReplacements[importPath]
      if (replacement !== undefined) {
        return pre + replacement + post
      }
      return whole
    }
  )
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
