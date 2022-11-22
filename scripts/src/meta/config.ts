
export const lockFilename = 'pnpm-lock.yaml'
export const workspaceFilename = 'pnpm-workspace.yaml'
export const turboFilename = 'turbo.json'
export const miscSubpaths = [
  '.npmrc',
  '.editorconfig',
]
export const allSubpaths = [
  lockFilename,
  workspaceFilename,
  turboFilename,
  ...miscSubpaths,
]
