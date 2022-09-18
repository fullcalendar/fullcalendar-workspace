import { join as joinPaths } from 'path'
import { mkdir } from 'fs/promises'
import { capture } from './utils/exec.js'
import { processSrcMeta, writeDistMeta } from './utils/pkg-meta.js'

// TODO: pass in dirs via cmd line, otherwise, does ALL
const pnpmPkgFilterArgs = ['--filter', './standard/**', '--filter', './premium/**']

export default async function() {
  const json = (await capture([
    'pnpm', 'list', '-r', '--depth', '-1', '--json', ...pnpmPkgFilterArgs
  ])).stdout
  const pkgObjs = JSON.parse(json)

  return Promise.all(
    pkgObjs.map(async (pkgObj: any) => {
      const pkgRootPath = pkgObj.path
      const pkgDistPath = joinPaths(pkgRootPath, 'dist')

      // TODO: filter based on publishConfig.linkDirectory and/or buildConfig
      if (
        !pkgObj.private ||
        pkgObj.name.match(/\-tests$/)
      ) {
        const { distMeta } = await processSrcMeta(
          true, // dev
          joinPaths(pkgRootPath, 'package.json')
        )

        await mkdir(pkgDistPath, { recursive: true })
        await writeDistMeta(distMeta, joinPaths(pkgDistPath, 'package.json'))
      }
    })
  )
}
