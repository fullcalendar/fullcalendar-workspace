import { join as joinPaths } from 'path'
import { readFile } from 'fs/promises'
import * as esbuild from 'esbuild'
import { execCapture } from '@fullcalendar/standard-scripts/utils/exec'
import { Blob } from 'buffer'

export default async function() {
  const pkgDir = process.cwd()
  const sizes = await getSrcSizes(pkgDir)

  console.table(pkgSrcSizesToStrs(sizes))
}

/*
All values are bytes of minified code
*/
export interface PkgSrcSizes {
  componentSize: number
  nonComponentSize: number
  totalSize: number
}

export async function getSrcSizes(pkgDir: string): Promise<PkgSrcSizes> {
  const componentSize = await getSrcSizeByType(pkgDir, 'tsx')
  const nonComponentSize = await getSrcSizeByType(pkgDir, 'ts')

  return {
    componentSize,
    nonComponentSize,
    totalSize: componentSize + nonComponentSize,
  }
}

async function getSrcSizeByType(pkgDir: string, loader: esbuild.Loader): Promise<number> {
  const filesRaw = await execCapture([
    'find', 'src', '-type', 'f', '-name', '*.' + loader,
  ], {
    cwd: pkgDir,
  })
  const fileSubpaths = splitLines(filesRaw)
  const allLines: string[] = []

  for (const fileSubpath of fileSubpaths) {
    const filePath = joinPaths(pkgDir, fileSubpath)
    const srcCode = await readFile(filePath, 'utf8')

    // removes typescript and comments
    // because most example projects that measure size are in JSX with minimal comments
    const transpiledRes = await esbuild.transform(srcCode, {
      loader,
      jsxFactory: 'h',
    })
    const transpiledCode = transpiledRes.code

    // console.log()
    // console.log()
    // console.log(transpiledCode)
    // console.log()
    // console.log()

    if (
      (loader === 'tsx' || loader === 'jsx') &&
      !transpiledCode.match(/\bh\(/) &&
      !transpiledCode.match(/\bextends \w*Component\b/) &&
      !srcCode.match(/\bpreact\b/) // importing types from typescript src
    ) {
      console.error(`[NO JSX/PREACT]: ${filePath}`)
    }

    allLines.push(transpiledCode)
  }

  return new Blob(allLines).size
}

// PkgSrcSize utils
// -------------------------------------------------------------------------------------------------

export interface PkgSrcSizeStrs {
  componentSize: string
  nonComponentSize: string
  totalSize: string
}

export function pkgSrcSizesToStrs(sizes: PkgSrcSizes): PkgSrcSizeStrs {
  return {
    componentSize: formatBytes(sizes.componentSize),
    nonComponentSize: formatBytes(sizes.nonComponentSize),
    totalSize: formatBytes(sizes.totalSize),
  }
}

// General utils
// -------------------------------------------------------------------------------------------------

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/*
TODO: use everywhere .split('\n') is used because doesn't handle empty string!
*/
function splitLines(str: string): string[] {
  const trimmedStr = str.trim()
  return trimmedStr ? trimmedStr.split('\n') : []
}
