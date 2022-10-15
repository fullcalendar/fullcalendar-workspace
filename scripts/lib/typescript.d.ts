
export declare function compileTs(
  monorepoDir: string,
  subdir?: string,
  tscArgs?: string[]
): Promise<void>

export declare function compileTsOnly(
  monorepoDir: string,
  subdir?: string,
  tscArgs?: string[]
): Promise<void>

export declare function ensureTsMeta(
  monorepoDir: string,
  subdir?: string,
): Promise<void>
