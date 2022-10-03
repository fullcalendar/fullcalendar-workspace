import { live } from '../utils/exec.js'
import runPreflight from './preflight.js'
import { filterArgs } from './lib.js'

export default async function() {
  await runPreflight()
  await live([
    'tsc', '-b'
  ])
  await live([
    'turbo', 'run', 'build', '--no-cache', ...filterArgs
  ])
  // TODO: write package.json files
}
