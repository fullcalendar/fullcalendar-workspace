
export interface CommandCliConfig {
  parameters?: string[]
  flags?: { [flag: string]: any }
}

export interface CommandConfig<Params, Flags> {
  parameters: string[] & Params
  flags: Flags
  commandName: string
  cwd: string
  bin: string
}
