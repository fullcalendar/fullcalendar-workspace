import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vitest/config'

/*
The smoke specs (react17-tests/tests) against the React installed in `pkgDir`. One React instance,
shared by the specs and the built calendar (whose own node_modules has React 19): every `react` and
`react-dom` import, subpaths too, resolves to the package's own
*/
export function defineSmokeConfig(pkgUrl: string) {
  const require = createRequire(pkgUrl)
  const reactDir = dirname(require.resolve('react/package.json'))
  const reactDomDir = dirname(require.resolve('react-dom/package.json'))
  const major = require('react/package.json').version.split('.')[0]
  const testsDir = new URL('./tests/', import.meta.url).pathname

  return defineConfig({
    resolve: {
      alias: [
        { find: /^react$/, replacement: reactDir },
        { find: /^react\/(.*)$/, replacement: `${reactDir}/$1` },
        { find: /^react-dom$/, replacement: reactDomDir },
        { find: /^react-dom\/(.*)$/, replacement: `${reactDomDir}/$1` },
        // the root API differs: legacy ReactDOM.render in 17, createRoot in 18
        { find: /^#harness$/, replacement: join(testsDir, major === '17' ? 'harness-17.ts' : 'harness-18.ts') },
      ],
    },
    test: {
      environment: 'jsdom',
      root: testsDir,
      include: ['*.tsx'],
      globals: true,
      env: { REACT_MAJOR: major },
      // transformed, not loaded by Node, so the aliases reach its imports too
      server: { deps: { inline: [/\/react\/dist\//] } },
    },
  })
}
