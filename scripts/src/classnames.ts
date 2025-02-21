import { join as joinPaths } from 'path'
import { execCapture } from '@fullcalendar-scripts/standard/utils/exec'

const CLASSNAME_PREFIX = 'fc-'
const CLASSNAME_RE = /(--)?fc-[\w-]+/g
const CSS_ONLY = false
const JS_ONLY = false

export default async function() {
  const monorepoDir = process.cwd()
  const grepBin = joinPaths(monorepoDir, 'scripts/bin/grep.sh')
  const output = await execCapture([grepBin, CLASSNAME_PREFIX])
  const lines = output.split('\n')
  const occurences = new Map<string, number>()

  for (const line of lines) {
    if (line) {
      const [file, _lineNum, code] = splitLimit(line, ':', 3)
      const isCss = file.endsWith('.css')

      if ((!CSS_ONLY || isCss) && (!JS_ONLY || !isCss)) {
        for (const [className] of code.matchAll(CLASSNAME_RE)) {
          occurences.set(className, (occurences.get(className) || 0) + 1)
        }
      }
    }
  }

  const classNamesSorted = [...occurences.keys()].sort()

  for (const className of classNamesSorted) {
    console.log(className, occurences.get(className))
  }

  console.log()
  console.log(occurences.size, 'results')
}

function splitLimit(input: string, delimiter: string, limit: number) {
  const parts = input.split(delimiter)
  const result = parts.slice(0, limit - 1)
  result.push(parts.slice(limit - 1).join(delimiter))
  return result
}
