import { join as joinPaths } from 'node:path'
import { Blob } from 'node:buffer'
import zlib from 'node:zlib'
import { promisify } from 'node:util'
import { readFile } from 'fs/promises'
import * as esbuild from 'esbuild'
import { ScriptContext } from '@fullcalendar/standard-scripts/utils/script-runner'
import { execCapture } from '@fullcalendar/standard-scripts/utils/exec'

const gzip = promisify(zlib.gzip)

export default async function(this: ScriptContext) {
  const pkgDir = this.cwd
  const pkgName = this.monorepoStruct.pkgDirToJson[pkgDir].name

  const pkgSrcs = await getPkgSrcs(pkgDir)
  const compiledRowMap = await compileSizes({ [pkgName]: pkgSrcs })

  displayTable(compiledRowMap)
}

// Console display
// -------------------------------------------------------------------------------------------------

export function displayTable(compiledRowMap: CompiledRowMap): void {
  const formattedRowMap: { [rowName: string]: any } = {}
  const rowNames = Object.keys(compiledRowMap)

  for (const rowName of rowNames) {
    const compiledRow = compiledRowMap[rowName]

    formattedRowMap[rowName] = {
      logic: formatBytes(compiledRow.logic),
      component: formatBytes(compiledRow.component),
      style: formatBytes(compiledRow.style),
      total: formatBytes(compiledRow.total),
    }
  }

  console.table(formattedRowMap)
}

// Compile sizes for one or more packages
// -------------------------------------------------------------------------------------------------

export type PkgSrcsMap = { [pkgName: string]: PkgSrcs }
export type CompiledRow = PkgSizes & { total: number }
export type CompiledRowMap = { [rowName: string]: CompiledRow }

export async function compileSizes(
  pkgSrcsMap: PkgSrcsMap,
  pkgNames?: string[],
): Promise<CompiledRowMap> {
  if (!pkgNames) {
    pkgNames = Object.keys(pkgSrcsMap)
    pkgNames.sort()
  }

  const rowMap: CompiledRowMap = {}
  const combinedSrcs: PkgSrcs = {
    logic: [],
    component: [],
    style: [],
  }
  const combinedSizes: PkgSizes = {
    logic: 0,
    component: 0,
    style: 0,
  }

  for (const pkgName of pkgNames) {
    const pkgSrcs = pkgSrcsMap[pkgName]
    const pkgSizes = computePkgSizes(pkgSrcs)

    rowMap[pkgName] = compileRow(pkgSizes)

    combinedSrcs.logic.push(...pkgSrcs.logic)
    combinedSrcs.component.push(...pkgSrcs.component)
    combinedSrcs.style.push(...pkgSrcs.style)

    combinedSizes.logic += pkgSizes.logic
    combinedSizes.component += pkgSizes.component
    combinedSizes.style += pkgSizes.style
  }

  if (pkgNames.length > 1) {
    rowMap.TOTAL = compileRow(combinedSizes)
  }

  const minGzSizes = await computeMinGzPkgSizes(combinedSrcs)
  rowMap['MIN+GZ'] = compileRow(minGzSizes)

  return rowMap
}

function compileRow(pkgSizes: PkgSizes): CompiledRow {
  return {
    ...pkgSizes,
    total: pkgSizes.logic + pkgSizes.component + pkgSizes.style,
  }
}

// Minified+gzip SIZES
// -------------------------------------------------------------------------------------------------

async function computeMinGzPkgSizes(pkgSrcs: PkgSrcs): Promise<PkgSizes> {
  const [logic, component, style] = await Promise.all([
    computeJsMinGzSize(pkgSrcs.logic),
    computeJsMinGzSize(pkgSrcs.component),
    computeCssMinGzSize(pkgSrcs.style),
  ])

  return { logic, component, style }
}

// Minified+gzip SOURCES
// -------------------------------------------------------------------------------------------------

async function computeJsMinGzSize(srcs: string[]): Promise<number> {
  const minifiedSrc = (await Promise.all(
    srcs.map(async (src) => {
      return (await esbuild.transform(src, {
        loader: 'jsx',
        jsxFactory: 'h',
        minify: true,
      })).code
    }),
  )).join('\n')

  // return computeStrSize([minifiedSrc])
  return await computeGzipSize(minifiedSrc)
}

async function computeCssMinGzSize(srcs: string[]): Promise<number> {
  const massagedSrc = srcs.join('\n').replace(/\s+/g, ' ')

  // return computeStrSize([massagedSrc])
  return await computeGzipSize(massagedSrc)
}

async function computeGzipSize(str: string): Promise<number> {
  return (await gzip(str, { level: 9 })).length
}

// Source code SIZES per-package
// -------------------------------------------------------------------------------------------------

interface PkgSizes {
  logic: number
  component: number
  style: number
}

function computePkgSizes(pkgSrcs: PkgSrcs): PkgSizes {
  return {
    logic: computeStrSize(pkgSrcs.logic),
    component: computeStrSize(pkgSrcs.component),
    style: computeStrSize(pkgSrcs.style),
  }
}

function computeStrSize(str: string[]): number {
  return new Blob(str).size
}

// Source code STRINGS per-package
// -------------------------------------------------------------------------------------------------

export interface PkgSrcs {
  logic: string[]
  component: string[]
  style: string[]
}

export async function getPkgSrcs(pkgDir: string): Promise<PkgSrcs> {
  const [logic, component, style] = await Promise.all([
    getLogicSrcs(pkgDir),
    getComponentSrcs(pkgDir),
    getStyleSrcs(pkgDir),
  ])
  return { logic, component, style }
}

// Type-specific source code
// -------------------------------------------------------------------------------------------------

async function getLogicSrcs(pkgDir: string): Promise<string[]> {
  const srcsMap = await getRawSrcs(pkgDir, '.ts')

  return Promise.all(
    Object.keys(srcsMap).map(async (path) => {
      const src = srcsMap[path]
      const transpiledSrc = (await esbuild.transform(src, {
        loader: 'ts',
      })).code

      return transpiledSrc
    }),
  )
}

async function getComponentSrcs(pkgDir: string): Promise<string[]> {
  const srcsMap = await getRawSrcs(pkgDir, '.tsx')

  return Promise.all(
    Object.keys(srcsMap).map(async (path) => {
      const src = srcsMap[path]
      const transpiledSrc = (await esbuild.transform(src, {
        loader: 'tsx',
        jsx: 'preserve',
      })).code

      if (
        !transpiledSrc.match(/\bh\(/) &&
        !transpiledSrc.match(/\bextends \w*Component\b/) &&
        !src.match(/\bpreact\b/) // importing types from typescript src
      ) {
        console.warn(`[NO JSX/PREACT]: ${path}`)
      }

      return transpiledSrc
    }),
  )
}

async function getStyleSrcs(pkgDir: string): Promise<string[]> {
  return Object.values(await getRawSrcs(pkgDir, '.css'))
}

// Source code retrieval
// -------------------------------------------------------------------------------------------------

type SrcsMap = { [path: string]: string }

async function getRawSrcs(pkgDir: string, extension: string): Promise<SrcsMap> {
  const filesRaw = await execCapture([
    'find', 'src', '-type', 'f', '-name', '*' + extension,
  ], {
    cwd: pkgDir,
  })
  const fileSubpaths = splitLines(filesRaw)
  const srcsMap: SrcsMap = {}

  await Promise.all(
    fileSubpaths.map(async (fileSubpath) => {
      const filePath = joinPaths(pkgDir, fileSubpath)
      srcsMap[filePath] = await readFile(filePath, 'utf8')
    }),
  )

  return srcsMap
}

// General utils
// -------------------------------------------------------------------------------------------------

function formatBytes(bytes: number, decimals = 2) {
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
