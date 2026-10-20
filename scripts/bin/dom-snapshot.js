#!/usr/bin/env node
/*
Records and compares DOM snapshots of every view, for catching unintended DOM changes during
refactors. Opt-in only; snapshots are git-ignored (.dom-snapshots/). See planning/phase-1-dom-snapshot.md

Also records render-hook call counts (counts.json), which may go down but never up; `compare`
fails if any went up.

Usage:
  node scripts/bin/dom-snapshot.js record <label> [--only <substring>]
  node scripts/bin/dom-snapshot.js compare <labelA> <labelB> [--stat]
  node scripts/bin/dom-snapshot.js list

`record` runs the fixtures in premium/packages/vanilla-scheduler-tests/src/dom-snapshot/ against that
package's already-built dist/index.js, and writes to .dom-snapshots/<label>.<runtime>/. The runtime
(preact or react) is detected from the bundle: build it with FORCE_REACT=1 for react.
`compare` takes labels with or without the runtime suffix. Without a suffix, it compares every
runtime recorded under both labels. Exits 1 if anything differs.
*/
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { execFileSync, spawnSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'

const rootDir = join(fileURLToPath(import.meta.url), '../../..')
const snapshotsDir = join(rootDir, '.dom-snapshots')
const pkgDir = join(rootDir, 'premium/packages/vanilla-scheduler-tests')
const scriptsDir = join(rootDir, 'standard/scripts')

const [command, ...args] = process.argv.slice(2)

if (command === 'record') {
  await record(args)
} else if (command === 'compare') {
  compare(args)
} else if (command === 'list') {
  list()
} else {
  console.error('Usage: node scripts/bin/dom-snapshot.js record <label> [--only <substring>]')
  console.error('       node scripts/bin/dom-snapshot.js compare <labelA> <labelB> [--stat]')
  console.error('       node scripts/bin/dom-snapshot.js list')
  process.exit(1)
}

// Record
// -------------------------------------------------------------------------------------------------

async function record(args) {
  const label = args[0]
  const onlyIndex = args.indexOf('--only')
  const only = onlyIndex !== -1 ? args[onlyIndex + 1] : undefined

  if (!label || label.startsWith('--') || label.includes('/')) {
    console.error('record: expected a label, e.g. `record baseline`')
    process.exit(1)
  }

  const distPath = join(pkgDir, 'dist/index.js')

  if (!existsSync(distPath)) {
    console.error(`record: ${distPath} doesn't exist. Build the test package first.`)
    process.exit(1)
  }

  const snapshots = new Map() // fixture name -> html
  const resizeObserverLoops = {} // fixture name -> count, for fixtures that had any
  const callCounts = {} // scenario name -> { optionName: count }
  const variedCounts = {} // scenario name -> optionNames whose count varied between runs
  let runtime

  const require = createRequire(join(scriptsDir, 'package.json'))
  const karma = require('karma')
  const { default: buildKarmaConfig } = await import(join(scriptsDir, 'config/karma.js'))
  const baseConfig = buildKarmaConfig([distPath], false, [])

  function SnapshotReporter(baseReporterDecorator) {
    baseReporterDecorator(this)

    // receives __karma__.info(...) payloads that aren't logs
    this.onBrowserInfo = (browser, info) => {
      if (info.domSnapshotMeta) {
        runtime = info.domSnapshotMeta.runtime
      } else if (info.domSnapshot) {
        const { name, html } = info.domSnapshot
        snapshots.set(name, html)

        if (info.domSnapshot.resizeObserverLoops) {
          resizeObserverLoops[name] = info.domSnapshot.resizeObserverLoops
        }
      } else if (info.domSnapshotCounts) {
        const { name, counts, variedOptions } = info.domSnapshotCounts
        callCounts[name] = sortKeys(counts)

        if (variedOptions.length) {
          variedCounts[name] = variedOptions
        }
      }
    }
  }
  SnapshotReporter.$inject = ['baseReporterDecorator']

  const grep = only
    ? `/^dom-snapshot (reports the runtime|.*${escapeRegExp(only)})/`
    : 'dom-snapshot '


  const config = await karma.config.parseConfig(null, {
    ...baseConfig,
    basePath: resolve(pkgDir), // must be absolute, or karma doubles it up
    client: {
      ...baseConfig.client,
      args: ['--dom-snapshot', '--grep', grep],
      jasmine: { random: false, timeoutInterval: 20000 },
    },
    plugins: [...baseConfig.plugins, { 'reporter:dom-snapshot': ['type', SnapshotReporter] }],
    reporters: ['dots', 'dom-snapshot'],
    logLevel: karma.constants.LOG_WARN,
    browserNoActivityTimeout: 120000, // a headless Chrome stall once disconnected a run at the 30s default
  }, { promiseConfig: true, throwErrors: true })

  const exitCode = await new Promise((resolvePromise) => {
    new karma.Server(config, resolvePromise).start()
  })

  if (!runtime) {
    console.error('record: no results. Is the test bundle current, and does it include src/dom-snapshot/?')
    process.exit(1)
  }

  const outDir = join(snapshotsDir, `${label}.${runtime}`)
  rmSync(outDir, { recursive: true, force: true })
  mkdirSync(outDir, { recursive: true })

  for (const [name, html] of snapshots) {
    writeFileSync(join(outDir, fixtureFileName(name)), html)
  }

  writeFileSync(join(outDir, 'counts.json'), JSON.stringify(sortKeys(callCounts), null, 2) + '\n')

  const meta = {
    label,
    runtime,
    commit: git(['rev-parse', 'HEAD']),
    dirty: Boolean(git(['status', '--porcelain'])),
    date: new Date().toISOString(),
    only: only || null,
    fixtureCount: snapshots.size,
    countScenarioCount: Object.keys(callCounts).length,
    failed: exitCode !== 0,
    // dev builds (pnpm dev) have readable "f-<name>" classnames, others have hashed "fc-<hash>" ones.
    // the hashes are salted with the package version, so a version bump changes them all
    classNames: [...snapshots.values()].some((html) => /class="[^"]*\bf-[a-zA-Z]/.test(html))
      ? 'readable'
      : 'hashed',
    // not compared. ResizeObserver loop errors are swallowed while recording, but can point to
    // measurement problems, so they're listed here
    resizeObserverLoops,
    // counts are the max over several runs. these varied between runs, so small changes in them may be noise
    variedCounts,
  }
  writeFileSync(join(outDir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n')

  console.log(`\nWrote ${snapshots.size} snapshots and ${Object.keys(callCounts).length} count scenarios to ${outDir}`)
  console.log(`Commit ${meta.commit}${meta.dirty ? ' (working tree dirty)' : ''}`)

  const loopFixtures = Object.keys(resizeObserverLoops)
  if (loopFixtures.length) {
    console.log(`ResizeObserver loop errors (swallowed) in ${loopFixtures.length} fixtures: ${loopFixtures.join(', ')}`)
  }

  const variedScenarios = Object.keys(variedCounts)
  if (variedScenarios.length) {
    console.log(`Counts that varied between runs (max recorded): ${variedScenarios.map((name) => `${name} (${variedCounts[name].join(', ')})`).join('; ')}`)
  }

  if (exitCode !== 0) {
    console.error('Some fixtures failed; their snapshots are missing.')
  }

  process.exit(exitCode)
}

// Compare
// -------------------------------------------------------------------------------------------------

function compare(args) {
  const isStat = args.includes('--stat')
  const [labelA, labelB] = args.filter((arg) => !arg.startsWith('--'))

  if (!labelA || !labelB) {
    console.error('compare: expected two labels')
    process.exit(1)
  }

  const pairs = resolveLabelPairs(labelA, labelB)
  let hasDiffs = false

  for (const [dirA, dirB] of pairs) {
    console.log(`\n=== ${dirA} vs ${dirB}`)

    const metaA = readMeta(dirA)
    const metaB = readMeta(dirB)

    for (const [dir, meta] of [[dirA, metaA], [dirB, metaB]]) {
      if (meta.failed) {
        console.log(`FAILED RECORDING: the run that recorded ${dir} failed, so it can't be trusted. Re-record it.`)
        hasDiffs = true
      }
    }

    if (metaA.classNames !== metaB.classNames) {
      console.log(
        `WARNING: ${dirA} has ${metaA.classNames} classnames but ${dirB} has ${metaB.classNames}. ` +
        'Build both the same way (both with `pnpm dev`, or both with `pnpm build`).',
      )
    }

    const filesA = listSnapshotFiles(dirA)
    const filesB = listSnapshotFiles(dirB)
    const allFiles = [...new Set([...filesA, ...filesB])].sort()
    const changed = []
    const onlyA = []
    const onlyB = []

    for (const file of allFiles) {
      if (!filesB.includes(file)) {
        onlyA.push(file)
      } else if (!filesA.includes(file)) {
        onlyB.push(file)
      } else if (
        readFileSync(join(snapshotsDir, dirA, file), 'utf8') !==
        readFileSync(join(snapshotsDir, dirB, file), 'utf8')
      ) {
        changed.push(file)
      }
    }

    console.log(
      `${allFiles.length} fixtures: ${changed.length} changed, ` +
      `${onlyA.length} only in ${dirA}, ${onlyB.length} only in ${dirB}`,
    )

    for (const file of onlyA) {
      console.log(`  only in ${dirA}: ${file}`)
    }
    for (const file of onlyB) {
      console.log(`  only in ${dirB}: ${file}`)
    }
    for (const file of changed) {
      console.log(`  changed: ${file}`)
    }

    if (!isStat) {
      for (const file of changed) {
        // git exits 1 when files differ, which isn't an error here
        const res = spawnSync('git', [
          'diff', '--no-index', '--no-color', '--unified=3',
          join(snapshotsDir, dirA, file),
          join(snapshotsDir, dirB, file),
        ], { encoding: 'utf8' })

        process.stdout.write('\n' + res.stdout)
      }
    }

    if (changed.length || onlyA.length || onlyB.length) {
      hasDiffs = true
    }

    if (compareCounts(dirA, dirB)) {
      hasDiffs = true
    }
  }

  process.exit(hasDiffs ? 1 : 0)
}

/*
Render-hook call counts may go down, never up. Returns true if any went up, or a scenario is missing
*/
function compareCounts(dirA, dirB) {
  const countsA = readCounts(dirA)
  const countsB = readCounts(dirB)

  if (!countsA || !countsB) {
    console.log(`\nCall counts: not recorded in ${!countsA ? dirA : dirB}, skipping`)
    return false
  }

  const increases = []
  const decreases = []
  const scenarioNames = [...new Set([...Object.keys(countsA), ...Object.keys(countsB)])].sort()
  // a missing scenario means lost coverage, not fewer calls. a scenario with no calls is recorded as {}
  const missing = scenarioNames.filter((name) => !(name in countsA) || !(name in countsB))

  for (const scenarioName of missing) {
    console.log(`MISSING count scenario ${scenarioName} in ${!(scenarioName in countsA) ? dirA : dirB}`)
  }

  for (const scenarioName of scenarioNames) {
    if (missing.includes(scenarioName)) {
      continue
    }

    const scenarioA = countsA[scenarioName]
    const scenarioB = countsB[scenarioName]

    for (const optionName of new Set([...Object.keys(scenarioA), ...Object.keys(scenarioB)])) {
      const a = scenarioA[optionName] || 0
      const b = scenarioB[optionName] || 0

      if (b > a) {
        increases.push(`  ${scenarioName} ${optionName}: ${a} -> ${b}`)
      } else if (b < a) {
        decreases.push(`  ${scenarioName} ${optionName}: ${a} -> ${b}`)
      }
    }
  }

  console.log(`\nCall counts: ${increases.length} increased, ${decreases.length} decreased`)

  for (const line of increases) {
    console.log('INCREASED' + line)
  }
  for (const line of decreases) {
    console.log('decreased' + line)
  }

  return increases.length > 0 || missing.length > 0
}

function readCounts(dir) {
  const countsPath = join(snapshotsDir, dir, 'counts.json')
  return existsSync(countsPath) ? JSON.parse(readFileSync(countsPath, 'utf8')) : null
}

function resolveLabelPairs(labelA, labelB) {
  const dirs = listSnapshotDirs()

  if (dirs.includes(labelA) && dirs.includes(labelB)) {
    return [[labelA, labelB]]
  }

  const pairs = []

  for (const runtime of ['preact', 'react']) {
    const dirA = `${labelA}.${runtime}`
    const dirB = `${labelB}.${runtime}`

    if (dirs.includes(dirA) && dirs.includes(dirB)) {
      pairs.push([dirA, dirB])
    }
  }

  if (!pairs.length) {
    console.error(`compare: no runtime recorded under both "${labelA}" and "${labelB}". Recorded: ${dirs.join(', ')}`)
    process.exit(1)
  }

  return pairs
}

// List
// -------------------------------------------------------------------------------------------------

function list() {
  for (const dir of listSnapshotDirs()) {
    const meta = readMeta(dir)

    console.log(
      `${dir}\t${meta.fixtureCount ?? '?'} fixtures\t${(meta.commit || '').slice(0, 9)}` +
      `${meta.dirty ? ' (dirty)' : ''}\t${meta.date || ''}${meta.only ? `\tonly "${meta.only}"` : ''}`,
    )
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function listSnapshotDirs() {
  if (!existsSync(snapshotsDir)) {
    return []
  }

  return readdirSync(snapshotsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort()
}

function readMeta(dir) {
  const metaPath = join(snapshotsDir, dir, 'meta.json')
  return existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {}
}

function listSnapshotFiles(dir) {
  return readdirSync(join(snapshotsDir, dir)).filter((file) => file.endsWith('.html'))
}

// "timeGridWeek/default" -> "timeGridWeek--default.html"
function fixtureFileName(name) {
  return name.replace(/\//g, '--') + '.html'
}

function sortKeys(obj) {
  const sorted = {}

  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key]
  }

  return sorted
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function git(gitArgs) {
  return execFileSync('git', gitArgs, { cwd: rootDir, encoding: 'utf8' }).trim()
}
