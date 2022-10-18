import { rm } from 'fs/promises'

const pathsToDelete = [
  './dist',
  './tsconfig.json',
  './tsconfig.tsbuildinfo',
  './.tsbuildinfo', // for now
  './.turbo',
]

export default function() {
  return Promise.all(
    pathsToDelete.map((path) => rm(path, { force: true, recursive: true })),
  )
}
