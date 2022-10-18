import { ScriptContext } from './utils/script-runner.js'
import { MonorepoStruct, PkgStruct, traverseMonorepo  } from './utils/monorepo-struct.js'
import { writeDistPkgJson } from './pkg/json.js'

export default async function(this: ScriptContext, ...args: string[]) {
  const isDev = args.includes('--dev')

  await writeDistPkgJsons(this.monorepoStruct, isDev)
}

export async function writeDistPkgJsons(monorepoStruct: MonorepoStruct, isDev = false) {
  const promises: Promise<void>[] = []

  await traverseMonorepo(monorepoStruct, (pkgStruct: PkgStruct) => {
    promises.push(writeDistPkgJson(pkgStruct.pkgDir, pkgStruct.pkgJson, isDev))
  })

  await Promise.all(promises)
}
