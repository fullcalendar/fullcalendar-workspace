import { rm } from 'fs/promises'
import { live } from '../utils/exec.js'
import { filterArgs } from './lib.js'

export default async function() {
  await rm('dist', { recursive: true, force: true })
  await live([ 'turbo', 'run', 'clean', '--no-cache', ...filterArgs ])
}
