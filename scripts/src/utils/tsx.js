import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import spawn from 'cross-spawn'

const require = createRequire(import.meta.url)

export function runFile(filePath) {
  spawn(
    process.execPath,
    [
      ...getLoaderArgs(),
      filePath,
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

// TODO: tsx handles __esModule strangely (esModuleInterop). bug maintainer
// https://github.com/esbuild-kit/tsx/issues/67
export function cjsDefaultInterop(defaultImport) {
  return defaultImport.default || defaultImport
}
