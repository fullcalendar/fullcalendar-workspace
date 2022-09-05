
// TODO: ask cleye maintainer to expose these sub-types
export interface ScriptCliConfig {
  parameters?: string[]
  flags?: { [flag: string]: any }
}

export interface ScriptConfig<Parameters, Flags> {
  scriptName: string
  parameters: string[] & Parameters
  flags: Flags
  unknownFlags: { [flag: string]: any }
  cwd: string
  bin: string
}
