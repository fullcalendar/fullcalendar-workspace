#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'

const thisPkgDir = joinPaths(fileURLToPath(import.meta.url), '../..')

// temporary (for compiling ts)
import { promisify } from 'util'
import { execFile } from 'child_process'
import { copyFile } from 'fs/promises'
const standardScripsDir = joinPaths(fileURLToPath(import.meta.url), '../../../standard/scripts')
await copyFile(
  joinPaths(standardScripsDir, 'tsconfig.safe.json'),
  joinPaths(standardScripsDir, 'tsconfig.json'),
)
await copyFile(
  joinPaths(thisPkgDir, 'tsconfig.safe.json'),
  joinPaths(thisPkgDir, 'tsconfig.json'),
)
const execFileP = promisify(execFile)
await execFileP(
  joinPaths(standardScripsDir, 'node_modules/.bin/tsc'),
  ['-b'],
  { cwd: thisPkgDir, stdio: 'inherit' },
)

const stuff = await import('@fullcalendar/standard-scripts/script-runner')
stuff.runScript(thisPkgDir)
