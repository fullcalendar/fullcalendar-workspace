import { join as joinPaths } from 'path'
import { fileURLToPath } from 'url'
import { compileTs } from './typescript.js'

const thisPkgDir = joinPaths(fileURLToPath(import.meta.url), '../..')
const monorepoDir = joinPaths(thisPkgDir, '..')

export async function runScript(scriptPkgDir) {
  const scriptName = process.argv[2]
  const scriptArgs = process.argv.slice(3)

  if (!scriptName) {
    throw new Error('Must provide a script name')
  }

  await compileTs(monorepoDir, scriptPkgDir)

  const scriptPath = joinPaths(scriptPkgDir, 'dist', scriptName.replace(':', '/') + '.js')
  const scriptExports = await import(scriptPath)
  const scriptMain = scriptExports.default

  if (typeof scriptMain !== 'function') {
    throw new Error(`Script '${scriptPath}' must export a default function`)
  }

  await scriptMain(...scriptArgs)
}
