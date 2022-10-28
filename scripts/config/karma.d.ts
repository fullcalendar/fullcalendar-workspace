import karma from 'karma'

declare function buildKarmaConfig(
  distFiles: string[],
  isDev: boolean,
  cliArgs: string[],
): karma.ConfigOptions

export { buildKarmaConfig as default }
