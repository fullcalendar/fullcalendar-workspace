export class RowSyncer {
  orderedKeys: string[]

  constructor(private onSynced: () => void) {
    console.log('onSynced', this.onSynced)
  }

  pause() {
    console.log('pause')
  }

  resume() {
    console.log('resume')
  }

  isActive(): boolean {
    console.log('isActive?')
    return false
  }

  addHandler(key: string, func: (frameHeight: number) => void) {
    console.log('addListener', key)
  }

  removeHandler(key: string, func: (frameHeight: number) => void) {
    console.log('removeListener', key)
  }

  reportSize(key: string, subkey: string, height: number | undefined): void {
    console.log('reportSize', key, subkey, height)
  }

  getTop(key: string): number {
    console.log('getTop', key)
    return 0
  }

  getBottom(key: string): number {
    console.log('getBottom', key)
    return 0
  }

  topToIndex(top: number): number | undefined {
    console.log('topToIndex', top)
    return undefined
  }
}
