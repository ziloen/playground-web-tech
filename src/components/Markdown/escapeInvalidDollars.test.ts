import { describe, expect, it } from 'vitest'
import { escapeInvalidDollars } from './escapeInvalidDollars'

const cases = [
  ['Costs $19 today, then $29 next month.', 'Costs \\$19 today, then \\$29 next month.'],
  ['Euler: $e^{i\\pi}+1=0$.', 'Euler: $e^{i\\pi}+1=0$.'],
  ['Inline block: $$x^2 + y^2 = z^2$$', 'Inline block: $$x^2 + y^2 = z^2$$'],
  ['Invalid suffix: $x$2', 'Invalid suffix: \\$x\\$2'],
  ['No close: $x + y', 'No close: \\$x + y'],
  ['Already escaped: \\$19', 'Already escaped: \\$19'],
  ['Code: `$19 and $29`', 'Code: `$19 and $29`'],
  [
    'API 价格达到 **$50/百万 token**，相比上一代的 $25 直接翻倍。',
    'API 价格达到 **\\$50/百万 token**，相比上一代的 \\$25 直接翻倍。',
  ],
] as const

describe('escapeInvalidDollars', () => {
  it.each(cases)('%s', (input, expected) => {
    expect(escapeInvalidDollars(input)).toBe(expected)
  })
})
