import resolve from 'rollup-plugin-node-resolve'
import multiEntry from 'rollup-plugin-multi-entry'
import sourcemaps from 'rollup-plugin-sourcemaps'
import includePaths from 'rollup-plugin-includepaths'
import rootPackageConfig from './package.json'
import tsConfig from './tsconfig.json'

let isDev
if (!/^(development|production)$/.test(process.env.BUILD)) {
  console.warn('BUILD environment not specified. Assuming \'development\'')
  isDev = true
} else {
  isDev = process.env.BUILD === 'development'
}

let packageGlobals = {
  superagent: 'superagent',
  fullcalendar: 'FullCalendar'
}

let packagePaths = tsConfig.compilerOptions.paths
let packageNames = Object.keys(packagePaths)

/*
KNOWN BUG: when watching test files that don't have any import statements, tsc transpiles ALL files.
*/
let watchOptions = {
  chokidar: true, // better than default watch util. doesn't fire change events on stat changes (like last opened)
  clearScreen: false // let tsc do the screan clearing
}

function getDefaultPlugins() { // need to be instantiated each time
  let plugins = [ resolve() ] // for tslib

  if (isDev) {
    plugins.push(sourcemaps()) // for reading/writing sourcemaps
  }

  return plugins
}

for (let packageName of packageNames) {
  if (!packageGlobals[packageName]) {
    packageGlobals[packageName] = 'FullCalendarPlugins.' + packageName
  }
}

let externalPackageNames = Object.keys(
  Object.assign(
    {},
    packageGlobals,
    rootPackageConfig.dependencies, // hopefully covered in packageGlobals
    rootPackageConfig.peerDependencies // (if not, rollup will give an error)
  )
)

let ourPackageNames = packageNames.filter(function(packageName) {
  let packagePath = packagePaths[packageName][0]
  return packagePath.match(/^src\//)
})

export default [
  ...ourPackageNames.map(buildPackageConfig),
  buildTestConfig()
]

function buildPackageConfig(packageName) {
  return {
    onwarn,
    watch: watchOptions,
    input: 'tmp/tsc-output/' + packagePaths[packageName][0] + '.js',
    external: externalPackageNames,
    output: {
      file: 'dist/' + packageName + '/main.js',
      globals: packageGlobals,
      exports: 'named',
      name: packageGlobals[packageName],
      format: 'umd',
      sourcemap: isDev
    },
    plugins: getDefaultPlugins()
  }
}

function buildTestConfig() {
  return {
    onwarn,
    watch: watchOptions,
    input: [
      'tmp/tsc-output/tests/automated/globals.js', // needs to be first
      'tmp/tsc-output/tests/automated/**/*.js'
    ],
    external: externalPackageNames,
    output: {
      file: 'tmp/automated-tests.js',
      globals: packageGlobals,
      exports: 'none',
      format: 'umd',
      sourcemap: isDev
    },
    plugins: getDefaultPlugins().concat([
      includePaths({
        paths: [ 'tmp/tsc-output' ] // for resolving paths like 'fullcalendar/tests/automated/**'
      }),
      multiEntry({
        exports: false // otherwise will complain about exported utils
      })
    ])
  }
}

function onwarn(warning, warn) {
  if (warning.code !== 'PLUGIN_WARNING') {
    warn(warning)
  }
}
