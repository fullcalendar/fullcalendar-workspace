import { basename, join as joinPaths } from 'path'
import { readFile } from 'fs/promises'
import { Octokit } from 'octokit'
import { execLive } from '@fullcalendar-scripts/standard/utils/exec'
import { getSubrepos, readManifest } from './meta/utils.js'

export default async function() {
  const monorepoDir = process.cwd()
  const monorepoManifest = await readManifest(monorepoDir)
  const monorepoVersion = monorepoManifest.version

  const subrepoMap = await getSubrepos(monorepoDir)
  const errorMap = {} as any

  await tagAndReleaseRoot(monorepoDir, monorepoVersion).catch((error: Error) => {
    errorMap['.'] = error
  })

  for (const [subrepoSubdir, subrepoData] of Object.entries(subrepoMap)) {
    await tagAndReleaseSubrepo(monorepoDir, monorepoVersion, subrepoSubdir, subrepoData)
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
  }
}

async function tagAndReleaseRoot(monorepoDir: string, version: string): Promise<void> {
  const execOpts = { cwd: monorepoDir }
  const isCi = Boolean(process.env.CI)
  const githubToken = process.env.GITHUB_TOKEN
  const githubRepo = process.env.GITHUB_REPOSITORY
  const tagName = `v${version}`

  console.log(`Creating root tag ${tagName}...`)
  await execLive(['git', 'tag', '-a', tagName, '-m', tagName], execOpts)

  if (githubToken && githubRepo) {
    console.log('Pushing root tag to remote with credentials...')
    const secretUrl = `https://${githubToken}@github.com/${githubRepo}.git`
    await execLive(['git', 'push', secretUrl, tagName], execOpts)
  } else if (!isCi) {
    console.log('Pushing root tag to remote...')
    await execLive(['git', 'push', 'origin', tagName], execOpts)
  } else {
    throw new Error('Must specify GITHUB_TOKEN/GITHUB_REPOSITORY')
  }

  if (githubToken && githubRepo) {
    await createGithubRelease(
      githubToken,
      githubRepo,
      tagName,
      joinPaths(monorepoDir, `premium/dist/fullcalendar-scheduler-${version}.zip`),
      true, // linkToStandard
    )
  } else if (!isCi) {
    console.log('Skipping release creation')
  } else {
    throw new Error('Must specify GITHUB_TOKEN/GITHUB_REPOSITORY')
  }
}

async function tagAndReleaseSubrepo(
  monorepoDir: string,
  version: string,
  subrepoSubdir: string,
  subrepoData: any,
): Promise<void> {
  const execOpts = { cwd: monorepoDir }
  const isCi = Boolean(process.env.CI)
  const subrepoRemote = subrepoData['remote-url']
  const subrepoCommit = subrepoData['pulled-commit']

  if (!subrepoRemote || !subrepoCommit) {
    throw new Error('Could not determine subrepo remote/commit')
  }

  const githubTokenName = `GITHUB_${basename(subrepoSubdir).toUpperCase()}_TOKEN`
  const githubToken = process.env[githubTokenName]
  const githubRepo = remoteToGithubRepo(subrepoRemote)
  const secretUrl = githubToken && `https://${githubToken}@github.com/${githubRepo}.git`
  const gitSubrepoBin = joinPaths(monorepoDir, 'scripts/bin/git-subrepo.sh') // TODO: DRY

  if (secretUrl) {
    console.log('Pushing subrepo branch to remote with credentials...')
    await execLive([gitSubrepoBin, 'push', subrepoSubdir, '-r', secretUrl], execOpts)
  } else if (!isCi) {
    console.log('Pushing subrepo branch to remote...')
    await execLive([gitSubrepoBin, 'push', subrepoSubdir], execOpts)
  } else {
    throw new Error(`Must specify ${githubTokenName} environment variable`)
  }

  const tagNameShort = `v${version}`
  const tagName = `subrepo/${subrepoSubdir}/${tagNameShort}`

  console.log(`Creating tag ${tagName} ...`)
  await execLive(['git', 'tag', '-a', tagName, '-m', tagNameShort, subrepoCommit], execOpts)

  console.log(`Pushing tag ${tagName} ...`)
  await execLive(
    // provide a tag refspec so the remote gets the 'short' name
    ['git', 'push', secretUrl || subrepoRemote, `${tagName}:${tagNameShort}`],
    execOpts,
  )

  console.log(`Locally deleting tag ${tagName} ...`)
  await execLive(['git', 'tag', '-d', tagName], execOpts)

  if (githubToken) {
    const isStandard = githubRepo === 'fullcalendar/fullcalendar'
    await createGithubRelease(
      githubToken,
      githubRepo,
      tagName,
      isStandard && joinPaths(monorepoDir, `standard/dist/fullcalendar-${version}.zip`),
      !isStandard, // linkToStandard
    )
  } else if (!isCi) {
    console.log('Skipping release creation')
  } else {
    throw new Error(`Cannot create release without ${githubTokenName}`)
  }
}

async function createGithubRelease(
  githubToken: string,
  githubRepo: string,
  tagName: string,
  filePath?: string | false,
  linkToStandard?: boolean,
): Promise<void> {
  const octokit = new Octokit({ auth: githubToken })
  const octokitHeaders = { 'X-GitHub-Api-Version': '2022-11-28' }

  const [owner, repo] = githubRepo.split('/')
  const body = linkToStandard
    ? `See https://github.com/fullcalendar/fullcalendar/releases/tag/${tagName}`
    : 'TODO: manually enter release notes'

  console.log(`Creating release in ${githubRepo} ...`)
  const releaseRes = await octokit.request('POST /repos/{owner}/{repo}/releases', {
    owner,
    repo,
    tag_name: tagName,
    prerelease: tagName.includes('-'),
    body,
    headers: octokitHeaders,
  })

  if (filePath) {
    const fileName = basename(filePath)
    const fileRaw = await readFile(filePath)

    console.log(`Uploading release asset ${fileName} ...`)
    await octokit.request({
      method: 'POST',
      url: releaseRes.data.upload_url,
      name: fileName,
      data: fileRaw,
      headers: octokitHeaders,
    })
  }
}

function remoteToGithubRepo(remote: string): string {
  // input: git@github.com:fullcalendar/fullcalendar.git
  // input: https://github.com/fullcalendar/fullcalendar.git
  // output: fullcalendar/fullcalendar
  return remote.match(/github\.com[:/](.*)\.git$/)![1]
}