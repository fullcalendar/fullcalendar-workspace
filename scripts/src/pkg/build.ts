import runBundler from './bundle.js'
import runMeta from './meta.js'

export default async function(...args: string[]) {
  await runMeta(...args)
  await runBundler(...args)
}
