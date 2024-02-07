import { join as joinPaths } from 'path'
import { execCapture, execLive } from '@fullcalendar/standard-scripts/utils/exec'
import { fileExists } from '@fullcalendar/standard-scripts/utils/fs'

// Git utils
// -------------------------------------------------------------------------------------------------

export async function querySubrepoPkgs(monorepoDir: string): Promise<string[]> {
  let submoduleSubdirs = await getSubrepoDirs(monorepoDir)

  return await asyncFilter(submoduleSubdirs, (subdir) => {
    return fileExists(joinPaths(monorepoDir, subdir, 'package.json'))
  })
}

async function getSubrepoDirs(monorepoDir: string): Promise<string[]> {
  return Object.keys(await getSubrepos(monorepoDir))
}

async function getSubrepos(monorepoDir: string) {
  await ensureGitSubrepo(monorepoDir)
  const s: string = await execCapture(['git', 'subrepo', 'status', '--all'], { cwd: monorepoDir })

  const sections = s.split(/^(?=\S)/m) // split by non-indented starting line
  const subrepos = {} as any

  for (const section of sections) {
    const sectionMatch = section.match(
      // match quoted text in first line, then everything in subsequent lines
      // the . does NOT match newlines
      /^.*['"]([^'"]*)['"].*([\s\S]*)$/
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

let gitSubrepoEnsured = false

/*
Only works for CI environments
*/
async function ensureGitSubrepo(monorepoDir: string) {
  if (process.env.CI) {
    if (!gitSubrepoEnsured) {
      // git-subrepo installation instructions:
      // https://github.com/ingydotnet/git-subrepo?tab=readme-ov-file#installation
      // Needs to be raw shell string
      // `.` is like `source` but works in many types of shells
      const gitSubrepoInstallScript = joinPaths(monorepoDir, 'scripts/git-subrepo/.rc')
      const cmd = '. ' + gitSubrepoInstallScript

      console.log()
      console.log('Installing git-subrepo:')
      console.log(cmd)
      console.log()

      await execLive(cmd, { cwd: monorepoDir })
      gitSubrepoEnsured = true
    }
  }
}

// Lang utils
// -------------------------------------------------------------------------------------------------

async function asyncFilter<T = unknown>(
  arr: T[],
  predicate: (item: T) => Promise<boolean>,
): Promise<T[]> {
  const results = await Promise.all(arr.map(predicate))

  return arr.filter((_v, index) => results[index])
}
