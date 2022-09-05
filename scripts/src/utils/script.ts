
// TODO: ask cleye maintainer to expose these sub-types
export interface ScriptCliConfig {
  parameters?: string[]
  flags?: { [flag: string]: any }
}

export interface ScriptConfig<Parameters, Flags> {
  scriptName: string
  scriptArgs: string[]
  parameters: string[] & Parameters
  flags: Flags
  cwd: string
  bin: string
}
