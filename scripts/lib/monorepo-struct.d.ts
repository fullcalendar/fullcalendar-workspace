
export declare function queryPkgDirMap(monorepoDir: string): Promise<{ [pkgName: string]: string }>

export declare function queryPkgJson(pkgDir: string): Promise<any>

export declare function writePkgJson(pkgDir: string, pkgJsonObj: any): Promise<void>

export declare function buildFilterArgs(monorepoConfig: { defaultSubtrees?: string[] }): string[]
