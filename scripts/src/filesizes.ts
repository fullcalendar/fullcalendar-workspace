import { promisify } from "util"
import { resolve, join } from "path"
import { readFile } from "fs/promises"
import { gzip } from "zlib"
import { minify } from "terser"
import { glob } from "glob"

const gzipAsync = promisify(gzip)

async function getMinifiedGzipSize(dirPath: string): Promise<{ path: string, size: number } | null> {
  const filePath = join(dirPath, "dist/global.js")

  try {
    // Read the file content
    const fileContent = await readFile(filePath, "utf-8")

    // Minify using Terser
    const minified = await minify(fileContent)
    if (!minified.code) throw new Error("Minification failed")

    // Gzip the minified output
    const gzipped = await gzipAsync(minified.code)

    // Return the file size in bytes
    return { path: filePath, size: gzipped.length }
  } catch (error: any) {
    console.error(`Error processing ${filePath}:`, error.message)
    return null
  }
}

async function processDirectories(baseDir: string, globPatterns: string[], ignorePatterns: string[]) {
  let directories = new Set<string>()

  // Resolve all matching directories
  const matchedPaths = await glob(globPatterns, {
    cwd: baseDir,
    ignore: ignorePatterns,
  })
  matchedPaths.forEach((dir) => directories.add(resolve(dir)))

  // Process each directory
  const results = await Promise.all([...directories].map(getMinifiedGzipSize))

  // Filter out failed attempts and sort by size
  const validResults = results.filter((res): res is { path: string, size: number } => res !== null)
  validResults.sort((a, b) => b.size - a.size)

  // Print results
  validResults.forEach(({ path, size }) => {
    console.log(`${path}, ${size}`)
  })
}

const globPatterns = [
  "standard/packages/*",
  "premium/packages/*",
]
const ignorePatterns = [
  "premium/packages/pnpm-make-dedicated-lockfile",
]

export default function() {
  const monorepoDir = process.cwd()
  processDirectories(monorepoDir, globPatterns, ignorePatterns).catch(console.error)
}
