import { live } from '../utils/exec.js'
import { runTurboTask } from './lib.js'
import { runPreflight } from './preflight.js'
import runArchive from './archive.js'

export default async function(...args: string[]) {
  await runPreflight()
  await live([ 'tsc', '-b' ])
  await runTurboTask('build', args)
  await runArchive()
}
