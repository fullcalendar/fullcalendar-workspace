import { mkdir } from 'fs/promises'
import { processSrcMeta, writeDistMeta, writeNpmIgnore } from '../utils/pkg-meta'

export default async function(...args: string[]) {
  const dev = args.indexOf('--dev') !== -1

  const [{ distMeta }] = await Promise.all([
    processSrcMeta(dev),
    mkdir('./dist', { recursive: true })
  ])

  await Promise.all([
    writeDistMeta(distMeta),
    writeNpmIgnore(),
  ])
}
