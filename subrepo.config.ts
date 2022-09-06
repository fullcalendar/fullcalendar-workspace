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
  ]
}

const rootConfig: SubrepoRootConfig = {
  branch: 'workspace-refactor',
  subrepos: {
    'standard': {
      remote: 'git@github.com:fullcalendar/fullcalendar.git',
      ...commonConfig,
    },
    'examples': {
      remote: 'git@github.com:fullcalendar/fullcalendar-example-projects.git',
      ...commonConfig,
    },
    'contrib/react': {
      remote: 'git@github.com:fullcalendar/fullcalendar-react.git',
      ...commonConfig,
    },
    'contrib/vue2': {
      remote: 'git@github.com:fullcalendar/fullcalendar-vue.git',
      branchOverride: 'vue2-workspace-refactor',
      ...commonConfig,
    },
    'contrib/vue3': {
      remote: 'git@github.com:fullcalendar/fullcalendar-vue.git',
      branchOverride: 'vue3-workspace-refactor',
      ...commonConfig,
    }
  }
}

export default rootConfig
