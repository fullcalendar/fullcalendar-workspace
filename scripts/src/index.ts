import * as path from 'path'
import * as url from 'url'
import { run } from './utils/run'

const filePath = url.fileURLToPath(import.meta.url)
const dirPath = path.join(filePath, '..')

run({
  commandDir: dirPath,
  bin: path.join(dirPath, '../bin/workspace-script'),
  binName: 'workspace-script',
})
