
export interface ScriptCliConfig {
  parameters?: string[]
  flags?: { [flag: string]: any }
}

export interface ScriptConfig<Params, Flags> {
  parameters: string[] & Params
  flags: Flags
  scriptName: string
  cwd: string
  bin: string
}
