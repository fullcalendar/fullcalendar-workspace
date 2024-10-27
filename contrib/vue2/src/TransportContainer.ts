import Vue from 'vue'

const dummyContainer = typeof document !== 'undefined' ? document.createDocumentFragment() : null

const TransportContainer = Vue.extend({
  props: {
    inPlaceOf: typeof Element !== 'undefined' ? Element : Object,
    reportEl: Function, // TODO: better type
    tag: String,
    className: String,
    elStyle: Object, // FYI: Vue2 does not allow simply `style` as a component property
    attrs: Object
  },

  render(h) {
    return h(this.tag, {
      attrs: this.attrs,
      class: this.className,
      style: this.elStyle,
    }, this.$slots.default || [])
  },

  mounted() {
    replaceEl(this.$el, this.inPlaceOf)

    // insurance for if Preact recreates and reroots inPlaceOf element
    ;(this.inPlaceOf as HTMLElement).style.display = 'none'

    this.reportEl(this.$el)
  },

  updated() {
    /*
    If the ContentContainer's tagName changed, it will create a new DOM element in its
    original place. Detect this and re-replace.
    */
    if (dummyContainer && this.inPlaceOf.parentNode !== dummyContainer) {
      replaceEl(this.$el, this.inPlaceOf)
      this.reportEl(this.$el)
    }
  },

  beforeDestroy() {
    // protect against Preact recreating and rerooting inPlaceOf element
    if (dummyContainer && this.inPlaceOf.parentNode === dummyContainer) {
      dummyContainer.removeChild(this.inPlaceOf)
    }

    this.reportEl(null)
  }
})

export default TransportContainer

function replaceEl(subject: Element, inPlaceOf: Element): void {
  inPlaceOf.parentNode?.insertBefore(subject, inPlaceOf.nextSibling)

  if (dummyContainer) {
    dummyContainer.appendChild(inPlaceOf)
  }
}
