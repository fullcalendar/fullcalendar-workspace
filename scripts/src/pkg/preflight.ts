import { mkdir } from 'fs/promises'
import { processSrcMeta, writeDistMeta, writeNpmIgnore } from '../utils/pkg-meta'

export default async function() {
  const [{ distMeta }] = await Promise.all([
    processSrcMeta(true), // dev=true (for running immediately after tsc)
    mkdir('./dist', { recursive: true })
  ])

  await Promise.all([
    writeDistMeta(distMeta),
    writeNpmIgnore(),
  ])
}
