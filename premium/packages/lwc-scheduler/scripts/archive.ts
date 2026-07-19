#!/usr/bin/env node

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { archiveLwcPackage } from '../../../../standard/packages/lwc-calendar/scripts/lib/archive.ts'

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const licensePath = join(packageDir, '../..', 'LICENSE.md')

archiveLwcPackage({
  packageDir,
  archiveBaseName: 'fullcalendar-scheduler-lwc',
  licensePath,
}).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
