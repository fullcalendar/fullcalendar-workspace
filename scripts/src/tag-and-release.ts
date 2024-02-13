import { join as joinPaths } from 'path'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'
import { getSubrepos, readManifest } from './meta/utils.js'
import { changelogSrc, getChangelogEntry } from './version-notes.js'

const TAG_POSTFIX = '-test'

export default async function() {
  const monorepoDir = process.cwd()
  const monorepoManifest = await readManifest(monorepoDir)
  const monorepoVersion = monorepoManifest.version

  const subrepoMap = await getSubrepos(monorepoDir)
  const errorMap = {} as any

  await tagAndReleaseRoot(monorepoDir, monorepoVersion).catch((error: Error) => {
    errorMap['.'] = error
  })

  for (const [subrepoSubdir, subrepo] of Object.entries(subrepoMap)) {
    await tagAndReleaseSubrepo(monorepoDir, monorepoVersion, subrepoSubdir, subrepo)
      .catch((error: Error) => {
        errorMap[subrepoSubdir] = error
      })
  }

  const errorCnt = Object.keys(errorMap).length
  if (errorCnt) {
    console.error(`Problem doing push/tag/release on ${errorCnt} repos:`)
    console.error()

    for (const [repoSubdir, error] of Object.entries(errorMap)) {
      console.error(`Repo: ${repoSubdir}`)
      console.error(error)
      console.error()
    }

    process.exit(1)
  }
}

async function tagAndReleaseRoot(monorepoDir: string, version: string): Promise<void> {
  const execOpts = { cwd: monorepoDir }
  const tagName = `v${version}${TAG_POSTFIX}`

  console.log(`Creating root tag ${tagName}...`)
  await execLive(['git', 'tag', '-a', tagName, '-m', tagName], execOpts)

  console.log('Pushing root tag to remote...')
  await execLive(['git', 'push', 'origin', tagName], execOpts)

  await createGithubRelease(
    'fullcalendar/fullcalendar-workspace', // TODO: read this from manifest
    tagName,
    version,
    monorepoDir,
    `premium/dist/fullcalendar-scheduler-${version}.zip`,
    true, // linkToStandard
  )
}

async function tagAndReleaseSubrepo(
  monorepoDir: string,
  version: string,
  subrepoSubdir: string,
  subrepo: any,
): Promise<void> {
  // HACK. TODO: filter away subrepos that don't have package.json
  if (subrepoSubdir === 'examples') {
    return
  }

  const execOpts = { cwd: monorepoDir }
  const tagName = `v${version}${TAG_POSTFIX}`
  const tempTagName = `subrepo/${subrepoSubdir}/${tagName}`
  const subrepoRemote = subrepo['remote-url']
  const subrepoCommit = subrepo['pulled-commit']

  console.log(`Creating temp tag ${tempTagName} ...`)
  await execLive(['git', 'tag', '-a', tempTagName, '-m', tagName, subrepoCommit], execOpts)

  try {
    console.log(`Pushing as tag ${tagName} ...`)
    await execLive(['git', 'push', subrepoRemote, `${tempTagName}:${tagName}`], execOpts)
  } finally {
    console.log(`Deleting temp tag ${tempTagName} ...`)
    await execLive(['git', 'tag', '-d', tempTagName], execOpts)
  }

  await createGithubRelease(
    remoteToGithubRepo(subrepoRemote),
    tagName, // the tag the remote uses
    version,
    monorepoDir,
    subrepoSubdir === 'standard' && `standard/dist/fullcalendar-${version}.zip`,
    subrepoSubdir !== 'standard', // linkToStandard
  )
}

async function createGithubRelease(
  githubRepo: string,
  tagName: string,
  version: string,
  monorepoDir: string,
  filePath?: string | false,
  linkToStandard?: boolean,
): Promise<void> {
  const execOpts = { cwd: monorepoDir }
  const releaseNotes = linkToStandard
    // TODO: make DRY by using package.json for repo URL
    ? `See https://github.com/fullcalendar/fullcalendar/releases/tag/${tagName}`
    : (await getChangelogEntry(joinPaths(monorepoDir, changelogSrc), version) ||
        '_Manually enter release notes_')

  await execLive([
    'gh', 'release', 'create',
    '--repo', githubRepo,
    ...(tagName.includes('-') ? ['--prerelease'] : []),
    '--notes', releaseNotes,
    tagName,
    ...(filePath ? [joinPaths(monorepoDir, filePath)] : []),
  ], execOpts)
}

function remoteToGithubRepo(remote: string): string {
  // input: git@github.com:fullcalendar/fullcalendar.git
  // input: https://github.com/fullcalendar/fullcalendar.git
  // output: fullcalendar/fullcalendar
  return remote.match(/github\.com[:/](.*)\.git$/)![1]
}
