
// Git utils
// -------------------------------------------------------------------------------------------------

// TEMPORARY. RENAME.
export async function queryGitSubmodulePkgs(monorepoDir: string): Promise<string[]> {
  return [
    'standard',
    'examples',
    'contrib/angular',
    'contrib/react',
    'contrib/vue2',
    'contrib/vue3',
  ]
}

// Lang utils
// -------------------------------------------------------------------------------------------------

async function asyncFilter<T = unknown>(
  arr: T[],
  predicate: (item: T) => Promise<boolean>,
): Promise<T[]> {
  const results = await Promise.all(arr.map(predicate))

  return arr.filter((_v, index) => results[index])
}
