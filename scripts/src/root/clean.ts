import { rm } from 'fs/promises'
import { runTurboTask } from './lib.js'

export default async function() {
  await rm('dist', { recursive: true, force: true })
  await runTurboTask('clean', ['--no-cache'])
}
