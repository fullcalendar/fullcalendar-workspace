#!/usr/bin/env node

import { findWorkspaceDir } from '@pnpm/find-workspace-dir'
import { makeDedicatedLockfile } from './lib.js'

(async () => {
  const verbose = process.argv.slice(2).includes('-v')
  const projectDir = process.cwd()
  const lockfileDir = await findWorkspaceDir(projectDir)

  if (!lockfileDir) {
    throw new Error('Cannot create a dedicated lockfile for a project that is not in a workspace.')
  }

  await makeDedicatedLockfile(lockfileDir, projectDir, verbose)
})()
