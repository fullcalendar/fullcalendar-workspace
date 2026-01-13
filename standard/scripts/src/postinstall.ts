import { ScriptContext } from './utils/script-runner.js'
import { writeDistPkgJsons } from './json.js'

export default async function(this: ScriptContext) {
  await Promise.all([
    writeDistPkgJsons(
      this.monorepoStruct,
      true, // isDev
      true, // reuseExisting
    ),
  ])
}
