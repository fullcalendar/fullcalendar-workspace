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
      remote: '../../Scratch/temp-repos/fullcalendar',
      ...commonConfig,
    },
    'examples': {
      remote: '../../Scratch/temp-repos/fullcalendar-example-projects',
      ...commonConfig,
    },
    'contrib/react': {
      remote: '../../Scratch/temp-repos/fullcalendar-react',
      ...commonConfig,
    },
    'contrib/vue2': {
      remote: '../../Scratch/temp-repos/fullcalendar-vue2',
      branchOverride: 'vue2-workspace-refactor',
      ...commonConfig,
    },
    'contrib/vue3': {
      remote: '../../Scratch/temp-repos/fullcalendar-vue3',
      branchOverride: 'vue3-workspace-refactor',
      ...commonConfig,
    }
  }
}

export default rootConfig
