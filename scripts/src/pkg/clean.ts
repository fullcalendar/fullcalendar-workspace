import { rm } from 'fs/promises'

export default async function(...args: string[]) {
  await rm('./dist', { force: true, recursive: true })
}
