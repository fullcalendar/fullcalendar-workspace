#!/usr/bin/env node

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeDerivedLwcMetadata } from '../../../../standard/packages/lwc/scripts/lib/build.ts'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')

writeDerivedLwcMetadata({
  sourcePath: join(
    packageDir,
    '../lwc-scheduler/dist/src-sfdx/force-app/main/default/lwc/fullCalendarScheduler/fullCalendarScheduler.js-meta.xml',
  ),
  outputPath: join(
    packageDir,
    'force-app/main/default/lwc/schedulerDemo/schedulerDemo.js-meta.xml',
  ),
  componentLabel: 'Scheduler Demo',
  componentDescription: 'Smoke test for the FullCalendar LWC Scheduler wrapper',
  targets: ['lightning__AppPage', 'lightning__HomePage'],
}).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
