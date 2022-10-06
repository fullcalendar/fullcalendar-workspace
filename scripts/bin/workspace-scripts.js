#!/usr/bin/env node

import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

const scriptName = process.argv[2]
const scriptArgs = process.argv.slice(3)

if (!scriptName) {
  throw new Error('Must provide a script name')
}

const thisPkgRoot = joinPaths(fileURLToPath(import.meta.url), '../..')

// compile all ts -> js
await new Promise((resolve, reject) => {
  spawn(
    './node_modules/typescript/bin/tsc', ['-b'],
    { cwd: thisPkgRoot, stdio: 'inherit' },
  ).on('close', (status) => {
    if (status === 0) {
      resolve()
    } else {
      reject()
    }
  })
})

const scriptPath = joinPaths(thisPkgRoot, 'dist', scriptName.replace(':', '/') + '.js')
const scriptExports = await import(scriptPath)
const scriptMain = scriptExports.default

if (typeof scriptMain !== 'function') {
  throw new Error(`Script '${scriptPath}' must export a default function`)
}

await scriptMain(...scriptArgs)
