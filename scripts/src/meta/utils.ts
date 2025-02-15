import { join as joinPaths } from 'path'
import { execCapture } from '@fullcalendar-scripts/standard/utils/exec'
import { fileExists, readJson, writeJson } from '@fullcalendar-scripts/standard/utils/fs'

// Git Subrepo Utils
// -------------------------------------------------------------------------------------------------

export async function querySubrepoPkgs(monorepoDir: string): Promise<string[]> {
  let submoduleSubdirs = await getSubrepoDirs(monorepoDir)

  return await asyncFilter(submoduleSubdirs, (subdir) => {
    return fileExists(joinPaths(monorepoDir, subdir, 'package.json'))
  })
}

export async function getSubrepoDirs(monorepoDir: string): Promise<string[]> {
  return Object.keys(await getSubrepos(monorepoDir))
}

export async function getSubrepo(monorepo: string, name: string) {
  const subrepos = await getSubrepos(monorepo, name)
  return subrepos[name]
}

export async function getSubrepos(monorepoDir: string, singleName?: string) {
  const s: string = await execCapture([
    joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh'), // TODO: DRY
    'status',
    singleName || '--all',
  ], {
    cwd: monorepoDir,
  })

  const sections = s.split(/^(?=\S)/m) // split by non-indented starting line
  const subrepos = {} as any

  for (const section of sections) {
    const sectionMatch = section.match(
      // match quoted text in first line, then everything in subsequent lines
      // the . does NOT match newlines
      /^.*['"]([^'"]*)['"].*([\s\S]*)$/,
    )
    if (sectionMatch) {
      const subrepoDir = sectionMatch[1]
      const lines = sectionMatch[2]
        .split(/[\n\r]+/)
        .map((line) => line.trim())
        .filter((line) => line) // remove blank
      const props = {} as any

      for (let line of lines) {
        const propMatch = line.match(/^(.*?)\s*:\s*(.*)$/)

        if (propMatch) {
          const key = propMatch[1].toLowerCase().replace(/\s+/, '-')
          const val = propMatch[2]
          props[key] = val
        }
      }

      subrepos[subrepoDir] = props
    }
  }

  return subrepos
}

// Manifest Read/Write
// -------------------------------------------------------------------------------------------------
// TODO: DRY with writeDistPkgJsons maybe?

export async function hasManifest(dir: string): Promise<boolean> {
  return fileExists(joinPaths(dir, 'package.json'))
}

export async function readManifest(dir: string): Promise<any> {
  const manifestPath = joinPaths(dir, 'package.json')
  return await readJson(manifestPath)
}

export async function writeManifest(dir: string, obj: any): Promise<string> {
  const manifestPath = joinPaths(dir, 'package.json')
  await writeJson(manifestPath, obj)
  return manifestPath
}

// Lang Utils
// -------------------------------------------------------------------------------------------------

async function asyncFilter<T = unknown>(
  arr: T[],
  predicate: (item: T) => Promise<boolean>,
): Promise<T[]> {
  const results = await Promise.all(arr.map(predicate))

  return arr.filter((_v, index) => results[index])
}
