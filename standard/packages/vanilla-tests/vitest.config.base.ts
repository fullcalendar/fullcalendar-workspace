import { defineConfig, type ViteUserConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { fileURLToPath } from 'node:url'
import * as commands from './vitest.commands'

/*
Shared by this package's vitest.config.ts and the premium test package's.
*/

// Some tests need the tall window.
// The Playwright context and Vitest's iframe get the same size so the iframe is never scaled,
// which keeps page.mouse coordinates equal to getBoundingClientRect coordinates.
export const VIEWPORT = { width: 1280, height: 1696 }

// Matches CI's TZ. Tests that use the `local` time zone depend on it.
export const TIME_ZONE = 'America/New_York'

process.env.TZ = TIME_ZONE // for the Node project's workers, which inherit it

/*
With FORCE_REACT set, the vanilla packages are swapped for their React-rendering builds, which have
the same API. Order matters: the first match wins.
*/
const FORCE_REACT_ALIASES = [
  { find: /^fullcalendar\/preact$/, replacement: 'fullcalendar-w-react/react' },
  { find: /^fullcalendar(\/.*)?$/, replacement: 'fullcalendar-w-react$1' },
  { find: /^fullcalendar-scheduler(\/.*)?$/, replacement: 'fullcalendar-scheduler-w-react$1' },
]

export function createTestConfig(options: {
  setupFile: string
  // deps that tests import lazily. pre-bundling them avoids a Vite reload mid-run on cold starts
  optimizeDepsInclude?: string[]
}): ViteUserConfig {
  return defineConfig({
    optimizeDeps: {
      include: options.optimizeDepsInclude || [],
    },
    resolve: {
      alias: process.env.FORCE_REACT ? FORCE_REACT_ALIASES : [],
    },
    define: {
      __FORCE_REACT__: JSON.stringify(Boolean(process.env.FORCE_REACT)), // see src/lib/env.ts
    },
    test: {
      onConsoleLog(log) {
        // the dev-parts plugin's once-per-page warning would otherwise print for every test file
        if (log.includes('dev-parts plugin is for development only')) {
          return false
        }
        // expected and harmless. unlike Karma, Vitest doesn't fail tests on them
        if (log.includes('ResizeObserver loop completed with undelivered notifications')) {
          return false
        }
      },
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            include: ['src/**/*.unit.ts'],
          },
        },
        {
          extends: true,
          test: {
            name: 'browser',
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.unit.ts', 'src/lib/**'],
            setupFiles: [options.setupFile],
            testTimeout: 10000,
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({
                contextOptions: {
                  viewport: VIEWPORT,
                  timezoneId: TIME_ZONE,
                },
              }),
              viewport: VIEWPORT,
              commands,
              instances: [
                { browser: 'chromium' },
              ],
            },
          },
        },
      ],
    },
  })
}

export function resolvePath(relPath: string, baseUrl: string): string {
  return fileURLToPath(new URL(relPath, baseUrl))
}
