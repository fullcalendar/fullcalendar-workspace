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
} from '@fullcalendar/lwc/scripts/lib/build.ts'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(join(packageDir, 'package.json'))
const standardLwcDir = dirname(require.resolve('@fullcalendar/lwc/package.json'))
const sourceLwcDir = join(standardLwcDir, 'src')

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
  appBuilderComponent: {
    sourceDir: join(packageDir, 'example'),
    componentName: 'fullCalendarSchedulerDemo',
  },
  copyAdditionalStaticResources: copySchedulerStaticResource,
}).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
