import { createTestConfig, resolvePath } from '../../../standard/packages/vanilla-tests/vitest.config.base'

export default createTestConfig({
  setupFile: resolvePath('./tests/lib/setup.ts', import.meta.url),
})
