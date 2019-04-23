const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const gulp = require('gulp')
const rename = require('gulp-rename')
const modify = require('gulp-modify-file')
const fcBuildUtils = require('./util')
const rootPackageConfig = require('../package.json')
const rootPackageVersion = rootPackageConfig.version || '0.0.0'
const corePackageConfig = require('../fullcalendar/dist/core/package.json')
const tsConfig = require('../tsconfig')
const packagePaths = tsConfig.compilerOptions.paths

// TODO: use this elsewhere
const ownPackagePaths = fcBuildUtils.filterHash(packagePaths, function(specificPackagePaths) {
  return specificPackagePaths[0].match(/^src\//)
})

let versionPrecision
if (rootPackageVersion.indexOf('-') !== -1) {
  console.log('Prerelease detected. Using exact version precision.')
  versionPrecision = ''
} else {
  versionPrecision = '~'
}


gulp.task('package-meta', [
  'package-meta:license',
  'package-meta:readme',
  'package-meta:json'
])

gulp.task('package-meta:license', function() {
  let stream = gulp.src('LICENSE.*')

  for (let packageName in packagePaths) {
    let shortPackageName = path.basename(packageName) // using path utils for normal strings :(
    let packagePath = packagePaths[packageName][0]

    if (packagePath.match(/^src\//)) {
      stream = stream.pipe(
        gulp.dest('dist/' + shortPackageName)
      )
    }
  }

  return stream
})

gulp.task('package-meta:json', function() {

  for (let packageName in packagePaths) {
    let packagePath = packagePaths[packageName][0]

    if (packagePath.match(/^src\//)) {
      let shortPackageName = path.basename(packageName) // using path utils for normal strings :(
      let overridePath = path.dirname(packagePath) + '/package.json'
      let overrides = require('../' + overridePath)
      let content = buildPackageConfig(packageName, overrides)

      let dir = 'dist/' + shortPackageName
      mkdirp.sync(dir)

      fs.writeFileSync(
        dir + '/package.json',
        JSON.stringify(content, null, '  ')
      )
    }
  }
})

gulp.task(
  'package-meta:readme',

  fcBuildUtils.mapHashVals(ownPackagePaths, function(singlePackagePaths, packageName) {
    let singlePackagePath = singlePackagePaths[0]
    let shortPackageName = path.basename(packageName) // using path utils for normal strings :(
    let overridePath = path.dirname(singlePackagePath) + '/package.json'
    let overrides = require('../' + overridePath) // TODO: this logic is in a lot of places
    let subtaskName = 'package-meta:readme:' + shortPackageName

    gulp.task(subtaskName, function() {
      return gulp.src('src/README.tpl.md')
        .pipe(
          modify(function(content) {
            return fcBuildUtils.renderSimpleTemplate(
              content,
              buildPackageConfig(packageName, overrides)
            )
          })
        )
        .pipe(
          rename('README.md')
        )
        .pipe(
          gulp.dest('dist/' + shortPackageName)
        )
    })

    return subtaskName
  })
)


function buildPackageConfig(packageName, overrides) {
  let res = Object.assign({}, rootPackageConfig, overrides, {
    name: packageName
  })

  delete res.devDependencies
  delete res.scripts
  delete res.browserGlobal

  let peerDependencies = overrides.peerDependencies
  let dependencies = overrides.dependencies

  if (peerDependencies) {
    peerDependencies = processDependencyMap(peerDependencies)
  }

  if (dependencies) {
    dependencies = processDependencyMap(dependencies)
  }

  if (packageName !== '@fullcalendar/core') {
    if (!peerDependencies) {
      peerDependencies = {}
    }
    peerDependencies['@fullcalendar/core'] = versionPrecision + (corePackageConfig.version || '0.0.0')
  }

  if (peerDependencies) {
    res.peerDependencies = peerDependencies
  }

  if (dependencies) {
    res.dependencies = dependencies
  }

  res.main = 'main.js'
  res.unpkg = 'main.min.js'
  res.types = 'main.d.ts'

  return res
}


function processDependencyMap(inputMap) {
  let outputMap = {}

  for (let dependencyName in inputMap) {

    if (rootPackageConfig.devDependencies[dependencyName]) {
      outputMap[dependencyName] = rootPackageConfig.devDependencies[dependencyName]

    } else if (dependencyName in packagePaths) {
      let dependencyPath = packagePaths[dependencyName][0]

      if (dependencyPath.match(/^src\//)) {
        outputMap[dependencyName] = versionPrecision + rootPackageVersion

      } else if (dependencyName.match(/^@fullcalendar\//)) {
        let depMetaPath = dependencyName.replace(/^@fullcalendar\//, '../fullcalendar/dist/') + '/package.json'
        let depMeta = require(depMetaPath)
        outputMap[dependencyName] = versionPrecision + (depMeta.version || '0.0.0')

      } else {
        console.error('Unknown dependency (1)', dependencyName)
      }
    } else {
      console.error('Unknown dependency (2)', dependencyName)
    }
  }

  return outputMap
}
