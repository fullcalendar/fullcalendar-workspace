#!/usr/bin/env node

import { createRequire } from 'module'
import { runIndex } from '../src/utils/cli.js'

const require = createRequire(import.meta.url)

runIndex(require.resolve('../src/index.ts'))
