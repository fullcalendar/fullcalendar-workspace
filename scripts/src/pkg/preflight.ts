import { mkdir } from 'fs/promises'
import { processSrcMeta, writeDistMeta } from '../utils/pkg-meta'

export default async function(...args: string[]) {
  const dev = args.indexOf('--dev') !== -1

  const { distMeta } = await processSrcMeta(dev)
  await mkdir('./dist', { recursive: true })
  await writeDistMeta(distMeta)
}
