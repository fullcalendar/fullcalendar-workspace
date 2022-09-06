#!/usr/bin/env node

import { createRequire } from 'module'
import { runFile } from '../src/utils/cli.js' // without loader, Node needs extension

const require = createRequire(import.meta.url)

runFile(require.resolve('../src/index.ts'))
