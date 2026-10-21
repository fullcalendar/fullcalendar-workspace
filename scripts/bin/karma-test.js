#!/usr/bin/env node
/*
Runs a test package's already-built dist/index.js once in headless Chrome, optionally filtered.

Usage:
  node scripts/bin/karma-test.js <testPkgDir> [grep]

<testPkgDir> is e.g. premium/packages/vanilla-scheduler-tests or standard/packages/vanilla-tests.
[grep] matches each spec's full name (describe titles + it title): a plain substring, or
/regex/flags. Omit it to run every spec.

Optional env, for running several at once:
  FC_TEST_BUNDLE  the bundle in the package's dist/ to run, instead of index.js (e.g. a copy of a
                  FORCE_REACT=1 build). Its .js.map is expected beside it
  FC_KARMA_PORT   Karma's port, instead of 9876
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
const bundleName = process.env.FC_TEST_BUNDLE || 'index.js'
const baseConfig = buildKarmaConfig([join(pkgDir, 'dist', bundleName)], false, [])

const config = await karma.config.parseConfig(null, {
  ...baseConfig,
  basePath: pkgDir,
  port: process.env.FC_KARMA_PORT ? Number(process.env.FC_KARMA_PORT) : baseConfig.port,
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
