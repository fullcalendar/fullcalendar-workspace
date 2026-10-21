
/*
A value that subscribers hear about: when it's set, and once on subscribing if it has one
*/
export class ObservableValue<Value> {
  private handlers: ((value: Value) => void)[] = []
  private currentValue: Value | undefined

  set(value: Value): void {
    this.currentValue = value

    for (let handler of this.handlers) {
      handler(value)
    }
  }

  subscribe(handler: (value: Value) => void) {
    this.handlers.push(handler)

    if (this.currentValue !== undefined) {
      handler(this.currentValue)
    }
  }
}
