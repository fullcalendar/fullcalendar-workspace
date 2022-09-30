import { rm } from 'fs/promises'

export default async function() {
  await rm('./dist', { force: true, recursive: true })
}
