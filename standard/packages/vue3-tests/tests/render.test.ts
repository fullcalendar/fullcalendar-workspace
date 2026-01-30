import { test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MockCalendar from './MockCalendar.vue'

test('renders DOM elements', () => {
  const wrapper = mount(MockCalendar)

  expect(wrapper.find('div').exists()).toBe(true)
})
