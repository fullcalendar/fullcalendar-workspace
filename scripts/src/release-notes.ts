import { readFile } from 'fs/promises'

// TODO: make DRY with other configs
// export is yuck
export const changelogSrc = 'standard/CHANGELOG.md'

export async function getReleaseNotes(changelogPath: string, version: string) {
  const [recentVersion, entry] = await getRecentChangelogEntry(changelogPath)
  return recentVersion === version ? entry : undefined
}

async function getRecentChangelogEntry(changelogPath: string) {
  const changelogText = await readFile(changelogPath, { encoding: 'utf8' })
  const match = changelogText.match(/(^|[\n\r])##\s+v?(\S*)[^\n\r]*(.*?)([\n\r]##\s+|$)/s)

  if (!match) {
    throw new Error('Could not find any changelog entries')
  }

  return [match[2], match[3].trim()]
}
