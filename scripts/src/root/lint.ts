import { runTurboTask } from './lib.js'

export default async function() {
  await runTurboTask('lint')
}
