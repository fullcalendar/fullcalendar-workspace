import Vue from 'vue'

const dummyContainer = typeof document !== 'undefined' ? document.createDocumentFragment() : null

const OffscreenFragment = Vue.extend({
  render(h) {
    /*
    Choose an exotic tag that FullCalendar's internal (p)react engine won't reuse
    (For behavior, see: https://codepen.io/arshaw/pen/wvXPwYG)
    */
    return h('aside', {
      style: { display: 'none' }
    }, this.$slots.default || [])
  },

  mounted() {
    if (dummyContainer) {
      dummyContainer.appendChild(this.$el)
    }
  },

  beforeDestroy() {
    if (dummyContainer) {
      dummyContainer.removeChild(this.$el)
    }
  }
})

export default OffscreenFragment
