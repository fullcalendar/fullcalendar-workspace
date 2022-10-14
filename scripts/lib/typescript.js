import { join as joinPaths, relative as relativizePath } from 'path'
import { lstat, mkdir, readFile, writeFile } from 'fs/promises'
import { queryPkgDirMap, queryPkgJson } from './monorepo-struct.js'

export async function ensureTsMeta(monorepoDir, subdir = '') {
  const pkgDirMap = await queryPkgDirMap(monorepoDir)
  const promiseMap = {}
  const allRefDirs = []

  if (subdir) {
    await traversePkg(joinPaths(monorepoDir, subdir), pkgDirMap, promiseMap, allRefDirs)
  } else {
    await Promise.all(
      Object.keys(pkgDirMap).map((pkgName) => {
        const pkgDir = pkgDirMap[pkgName]
        return traversePkg(pkgDir, pkgDirMap, promiseMap, allRefDirs)
      }),
    )

    await writeTsConfig(monorepoDir, {
      files: [],
      references: formatReferences(monorepoDir, allRefDirs),
    })
  }
}

async function traversePkg(pkgDir, pkgDirMap, promiseMap, allRefDirs) {
  return promiseMap[pkgDir] || (promiseMap[pkgDir] = async () => {
    const pkgJsonObj = await queryPkgJson(pkgDir)

    if (pkgJsonObj.tsConfig) {
      const depPkgNames = extractPkgDepNames(pkgJsonObj)
      const refDirs = []

      await Promise.all(
        depPkgNames.map(async (depPkgName) => {
          const depPkgDir = pkgDirMap[depPkgName]

          if (depPkgDir && (await traversePkg(depPkgDir, pkgDirMap, promiseMap, allRefDirs))) {
            refDirs.push(depPkgDir)
          }
        }),
      )

      await ensureTsPkgMeta(pkgDir, pkgJsonObj, refDirs)
      allRefDirs.push(pkgDir)
      return true
    }

    return false
  })()
}

async function ensureTsPkgMeta(pkgDir, pkgJsonObj, refDirs) {
  const { tsConfig } = pkgJsonObj

  if (tsConfig) {
    const tsConfigFinal = {
      ...tsConfig,
      compilerOptions: {
        composite: true,
        declaration: true,
        declarationMap: true,
        outDir: './.tsout',
        tsBuildInfoFile: './.tsbuildinfo',
        ...tsConfig.compilerOptions,
      },
      references: formatReferences(pkgDir, refDirs),
    }

    await Promise.all([
      writeTsConfig(pkgDir, tsConfigFinal),
      ensureLinkedPublishJson(pkgDir, pkgJsonObj),
    ])
  }
}

function extractPkgDepNames(pkgJsonObj) {
  return Object.keys(pkgJsonObj.dependencies || {})
    .concat(Object.keys(pkgJsonObj.devDependencies || {}))
}

function formatReferences(pkgDir, refDirs) {
  refDirs = refDirs.slice().sort() // deterministic order

  return refDirs.map((absDir) => ({
    path: relativizePath(pkgDir, absDir),
  }))
}

async function writeTsConfig(pkgDir, tsConfigFinal) {
  const destFile = joinPaths(pkgDir, 'tsconfig.json')
  const newJson = JSON.stringify(tsConfigFinal, undefined, 2)

  const doWrite = await readFile(destFile, 'utf8').then(
    (oldJson) => oldJson !== newJson, // different?
    () => true, // doesn't exist?
  )

  if (doWrite) {
    await writeFile(destFile, newJson)
  }
}

async function ensureLinkedPublishJson(pkgDir, pkgJsonObj) {
  const publishConfig = pkgJsonObj.publishConfig || {}

  if (
    publishConfig.directory &&
    publishConfig.linkDirectory
  ) {
    const publishDir = joinPaths(pkgDir, publishConfig.directory)
    const jsonPath = joinPaths(publishDir, 'package.json')
    const exists = await lstat(jsonPath).then(
      () => true,
      () => false,
    )

    if (!exists) {
      await mkdir(publishDir, { recursive: true })

      const json = JSON.stringify({
        name: pkgJsonObj.name,
        exports: {
          './package.json': './package.json',
          '.': { types: './.tsc/index.d.ts' },
          './*': { types: './.tsc/*.d.ts' },
        },
      }, undefined, 2)

      await writeFile(jsonPath, json)
    }
  }
}
