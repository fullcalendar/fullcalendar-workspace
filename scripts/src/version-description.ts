import { join as joinPaths } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { readManifest } from './meta/utils.js'

const changelogSrc = 'standard/CHANGELOG.md'
const releaseNotesDest = 'VERSION-DESCRIPTION.md'

export default async function() {
  const monorepoDir = process.cwd()
  const latestVersion = (await readManifest(monorepoDir)).version
  const changelogPath = joinPaths(monorepoDir, changelogSrc)
  const changelogEntry = await getChangelogEntry(changelogPath, latestVersion)
  const releaseNotes =
    `# v${latestVersion}\n\n` +
    (changelogEntry || '_No release notes yet_')

  await writeFile(releaseNotesDest, releaseNotes)
}

async function getChangelogEntry(
  changelogPath: string,
  desiredVersion: string,
) {
  const [version, entry] = await getRecentChangelogEntry(changelogPath)
  return version === desiredVersion ? entry : undefined
}

async function getRecentChangelogEntry(changelogPath: string) {
  const changelogText = await readFile(changelogPath, { encoding: 'utf8' })
  const match = changelogText.match(/(^|[\n\r])##\s+v?(\S*)[^\n\r]*(.*?)(##|$)/s)

  if (!match) {
    throw new Error('Could not find any changelog entries')
  }

  return [match[2], match[3].trim()]
}
