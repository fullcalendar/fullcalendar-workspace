
declare function runFile(filePath: string): void

declare function getLoaderArgs(): string[]

declare function cjsDefaultInterop<T>(defaultImport: T): T

export { run, getLoaderArgs, cjsDefaultInterop }
