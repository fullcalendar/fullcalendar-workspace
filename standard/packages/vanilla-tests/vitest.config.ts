import { createTestConfig, resolvePath } from './vitest.config.base'

export default createTestConfig({
  setupFile: resolvePath('./tests/lib/setup.ts', import.meta.url),
})
