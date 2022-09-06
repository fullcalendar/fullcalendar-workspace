import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import spawn from 'cross-spawn'

const require = createRequire(import.meta.url)

export function runIndex(indexFile) {
  spawn(
    process.execPath,
    [
      ...getLoaderArgs(),
      indexFile,
      ...process.argv.slice(2),
    ],
    {
      stdio: 'inherit',
    }
  )
}

export function getLoaderArgs() {
  return [
    '--require',
    require.resolve('tsx/suppress-warnings'),
    '--loader',
    pathToFileURL(require.resolve('tsx')).toString(),
  ]
}
