#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'
import { runScript } from '../dist/utils/script-runner.js'

const thisPkgDir = joinPaths(fileURLToPath(import.meta.url), '../..')

await runScript(thisPkgDir)
