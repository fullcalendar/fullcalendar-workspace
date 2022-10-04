import { live } from '../utils/exec.js'
import { runTurboTask } from './lib.js'
import { runPreflight } from './preflight.js'
import runArchive from './archive.js'

export default async function() {
  await runPreflight()
  await live([ 'tsc', '-b' ])
  await runTurboTask('build', ['--no-cache'])
  await runArchive()
}
