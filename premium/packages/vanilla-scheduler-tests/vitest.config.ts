import { createTestConfig, resolvePath } from '../../../standard/packages/vanilla-tests/vitest.config.base'

export default createTestConfig({
  setupFile: resolvePath('./src/lib/setup.ts', import.meta.url),
  // prebundled up front, so a cold cache doesn't reload a test file mid-run
  optimizeDepsInclude: ['fetch-mock'],
})
