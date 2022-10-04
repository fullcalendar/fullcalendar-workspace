import { join as joinPaths } from 'path'
import { monorepoRootDir } from  './lib.js'
import { live } from '../utils/exec.js'

export default async function() {
  await live(['pnpm', 'run', 'test'], { cwd: joinPaths(monorepoRootDir, 'standard/tests') })
  await live(['pnpm', 'run', 'test'], { cwd: joinPaths(monorepoRootDir, 'premium/tests') })
}
