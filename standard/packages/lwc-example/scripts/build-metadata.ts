#!/usr/bin/env node

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeDerivedLwcMetadata } from '../../lwc/scripts/lib/build.ts'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')

writeDerivedLwcMetadata({
  sourcePath: join(
    packageDir,
    '../lwc/dist/src-sfdx/force-app/main/default/lwc/fullCalendar/fullCalendar.js-meta.xml',
  ),
  outputPath: join(
    packageDir,
    'force-app/main/default/lwc/calendarDemo/calendarDemo.js-meta.xml',
  ),
  componentLabel: 'Calendar Demo',
  componentDescription: 'Smoke test for the FullCalendar LWC wrapper',
  targets: ['lightning__AppPage', 'lightning__HomePage'],
}).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
