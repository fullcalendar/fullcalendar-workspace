import { rm } from 'fs/promises'

export default function() {
  return Promise.all([
    rm('./dist', { force: true, recursive: true }),
    rm('./tsconfig.json', { force: true, recursive: true }),
    rm('./.tsbuildinfo', { force: true, recursive: true }),
    rm('./.tsout', { force: true, recursive: true }),
  ])
}
