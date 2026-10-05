#!/usr/bin/env node
/*
Runs a test package's already-built dist/index.js once in headless Chrome, optionally filtered.

Usage:
  node scripts/bin/karma-test.js <testPkgDir> [grep]

<testPkgDir> is e.g. premium/packages/vanilla-scheduler-tests or standard/packages/vanilla-tests.
[grep] matches each spec's full name (describe titles + it title): a plain substring, or
/regex/flags. Omit it to run every spec.
*/
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const rootDir = join(fileURLToPath(import.meta.url), '../../..')
const scriptsDir = join(rootDir, 'standard/scripts')
const require = createRequire(join(scriptsDir, 'package.json'))
const karma = require('karma')
const { default: buildKarmaConfig } = await import(join(scriptsDir, 'config/karma.js'))

const [pkgDirArg, grep] = process.argv.slice(2)

if (!pkgDirArg) {
  console.error('Usage: node scripts/bin/karma-test.js <testPkgDir> [grep]')
  process.exit(1)
}

const pkgDir = resolve(pkgDirArg) // must be absolute, or karma doubles it up
const baseConfig = buildKarmaConfig([join(pkgDir, 'dist/index.js')], false, [])

const config = await karma.config.parseConfig(null, {
  ...baseConfig,
  basePath: pkgDir,
  client: {
    ...baseConfig.client,
    args: grep ? ['--grep', grep] : [],
  },
  reporters: ['dots'], // prints only failures and a summary
  logLevel: karma.constants.LOG_WARN,
}, { promiseConfig: true, throwErrors: true })

new karma.Server(config, (exitCode) => {
  process.exit(exitCode)
}).start()
