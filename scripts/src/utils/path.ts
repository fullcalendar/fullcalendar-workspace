
export function buildFakeSrcPath(entryName: string): string {
  return './src/' + removeRelativePrefix(entryName) + '.js'
}

// does NOT include './dist/' at beginning
export function buildDistShortPath(srcPath: string): string {
  return removeExt(srcPath).replace(/^\.\/src\//, '')
}

export function isRelative(path: string): boolean {
  return /^\.\.?\/?/.test(path)
}

export function isRelativeDot(path: string): boolean { // '.', './', '..', '../'
  return /^\.\.?\/?$/.test(path)
}

export function isFilenameHidden(filename: string): boolean {
  return Boolean(filename.match(/^\./))
}

export function isWithinDir(path: string, dirPath: string): boolean {
  return path.indexOf(dirPath) === 0 // TODO: make sure dirPath ends in separator
}

export function getExt(path: string): string {
  if (isRelativeDot(path)) {
    return ''
  }
  const match = path.match(/\.[^\/]*$/)
  return match ? match[0] : ''
}

export function forceExt(path: string, ext: string): string {
  return removeExt(path) + ext
}

export function removeExt(path: string): string {
  const match = path.match(/^(.*)\.([^\/]*)$/)
  return match ? match[1] : path
}

export function removeRelativePrefix(path: string) {
  return path.replace(/^\.\/?/, '')
}
