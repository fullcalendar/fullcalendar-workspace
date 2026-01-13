#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'
import { runScript } from '@fullcalendar-scripts/standard/utils/script-runner'

const thisPkgDir = joinPaths(fileURLToPath(import.meta.url), '../..')
runScript(thisPkgDir)
