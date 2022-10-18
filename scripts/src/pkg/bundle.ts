
interface BundleConfig {
  pkgDir: string
  pkgJson: any
  isBundle: boolean
  isTests: boolean
  isDev: boolean
}

export async function writeBundles(config: BundleConfig): Promise<void> {
  console.log('TODO: buildBundles', config)
}

export async function watchBundles(config: BundleConfig): Promise<() => void> {
  console.log('TODO: watchBundles', config)
  return () => {}
}
