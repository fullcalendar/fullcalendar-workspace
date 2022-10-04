import { live } from '../utils/exec.js'
import { filterArgs } from './lib.js'
import { runPreflight } from './preflight.js'
import runArchive from './archive.js'

export default async function() {
  await runPreflight()
  await live([ 'tsc', '-b' ])
  await live([ 'turbo', 'run', 'build', '--no-cache', ...filterArgs ])
  await runArchive()
}
