import { join as joinPaths, relative as relativizePath } from 'path'
import { execLive, spawnLive } from './exec.js'
import { stringifyJson, writeIfDifferent } from './fs.js'
import { MonorepoStruct, PkgStruct, traverseMonorepo } from './monorepo-struct.js'

export async function compileTs(dir: string, tscArgs: string[] = []): Promise<void> {
  await execLive(['tsc', '-b', ...tscArgs], { cwd: dir })
}

export async function watchTs(dir: string, tscArgs: string[] = []): Promise<() => void> {
  // initial compile for resolving result
  await compileTs(dir, tscArgs)
  // for watching, will compile again but will be quick
  return spawnLive(['tsc', '-b', '--watch', ...tscArgs], { cwd: dir })
}

export async function writeTsconfigs(
  monorepoStruct: MonorepoStruct,
  startPkgDir = '',
): Promise<void> {
  const promises: Promise<void>[] = []

  await traverseMonorepo(
    monorepoStruct,
    (pkgStruct) => {
      promises.push(writePkgTsconfig(pkgStruct, monorepoStruct))
    },
    startPkgDir,
  )

  await Promise.all(promises)
}

async function writePkgTsconfig(
  pkgStruct: PkgStruct,
  monorepoStruct: MonorepoStruct,
): Promise<void> {
  const { pkgDir, pkgJson, localDepDirs } = pkgStruct
  const { tsConfig } = pkgJson

  if (tsConfig) {
    const refDirs: string[] = []

    for (let localDepDir of localDepDirs) {
      const depPkgJson = monorepoStruct.pkgDirToJson[localDepDir]

      if (depPkgJson.tsConfig) {
        refDirs.push(localDepDir)
      }
    }

    refDirs.sort() // deterministic order

    const finalTsConfig = {
      ...tsConfig,
      references: [
        ...(tsConfig.references || []),
        ...refDirs.map((refDir) => ({
          path: relativizePath(pkgDir, refDir),
        })),
      ],
    }

    await writeIfDifferent(
      joinPaths(pkgDir, 'tsconfig.json'),
      stringifyJson(finalTsConfig),
    )
  }
}
