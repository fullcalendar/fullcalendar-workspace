#!/usr/bin/env node

import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  type AdditionalStaticResourceContext,
  buildLwcPackage,
  resolveDistDirFromPackageJson,
  resourceMetaXmlText,
} from '../../../../standard/packages/lwc/scripts/lib/build.ts'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceLwcDir = join(packageDir, '../../../standard/packages/lwc/src')
const require = createRequire(join(packageDir, 'package.json'))

function transformComponentJs(source: string) {
  return replaceOnce(
    replaceOnce(
      replaceOnce(
        source,
        "import fullCalendarLib from '@salesforce/resourceUrl/fullCalendarLib'\n",
        "import fullCalendarLib from '@salesforce/resourceUrl/fullCalendarLib'\n" +
          "import fullCalendarSchedulerLib from '@salesforce/resourceUrl/fullCalendarSchedulerLib'\n",
      ),
      'const ADDITIONAL_PLUGIN_GLOBAL_URL = null',
      'const ADDITIONAL_PLUGIN_GLOBAL_URL = `${fullCalendarSchedulerLib}/all/global.js`',
    ),
    'const ADDITIONAL_REDISPATCHED_CALLBACKS = []',
    `const ADDITIONAL_REDISPATCHED_CALLBACKS = [
  'resourceAdd',
  'resourceChange',
  'resourceRemove',
]`,
  )
}

function replaceOnce(source: string, search: string, replacement: string) {
  if (!source.includes(search)) {
    throw new Error(`Could not find expected LWC source text: ${search}`)
  }

  return source.replace(search, replacement)
}

async function copySchedulerStaticResource({
  outputStaticResourcesDir,
}: AdditionalStaticResourceContext) {
  const schedulerPkgPath = require.resolve('fullcalendar-scheduler/package.json')
  const schedulerDistDir = resolveDistDirFromPackageJson(schedulerPkgPath)
  const outputSchedulerDir = join(outputStaticResourcesDir, 'fullCalendarSchedulerLib')
  const outputAllDir = join(outputSchedulerDir, 'all')

  await mkdir(outputAllDir, { recursive: true })
  await copyFile(join(schedulerDistDir, 'all', 'global.js'), join(outputAllDir, 'global.js'))
  await writeFile(
    join(outputStaticResourcesDir, 'fullCalendarSchedulerLib.resource-meta.xml'),
    resourceMetaXmlText,
  )
}

buildLwcPackage({
  packageDir,
  sourceLwcDir,
  componentName: 'fullCalendarScheduler',
  componentLabel: 'FullCalendar Scheduler',
  componentDescription: 'FullCalendar Scheduler component',
  transformComponentJs,
  copyAdditionalStaticResources: copySchedulerStaticResource,
}).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
