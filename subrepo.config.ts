import { SubrepoRootConfig } from '@fullcalendar/workspace-scripts/src/utils/subrepo'
import {
  generateSubdirLock,
  generateSubdirWorkspace,
} from '@fullcalendar/workspace-scripts/src/utils/pnpm'

const commonConfig = {
  metaFiles: [
    { path: '.npmrc' },
    { path: '.editorconfig' },
    { path: 'pnpm-workspace.yaml', generator: generateSubdirWorkspace },
    { path: 'pnpm-lock.yaml', generator: generateSubdirLock },
    // will need to copy patches
  ]
}

const rootConfig: SubrepoRootConfig = {
  branch: 'workspace-refactor',
  subrepos: {
    'standard': {
      remote: '../fullcalendar',
      ...commonConfig,
    },
    'examples': {
      remote: '../fullcalendar/example-projects',
      ...commonConfig,
    },
    'contrib/react': {
      remote: '../fullcalendar/packages-contrib/react',
      ...commonConfig,
    },
    'contrib/vue2': {
      remote: '../fullcalendar/packages-contrib/vue',
      branchOverride: 'vue2-workspace-refactor',
      ...commonConfig,
    },
    'contrib/vue3': {
      remote: '../fullcalendar/packages-contrib/vue3',
      branchOverride: 'vue3-workspace-refactor',
      ...commonConfig,
    }
  }
}

export default rootConfig
