import { describe, expect, it } from 'vitest'
import {
  formatDigested,
  formatMoney,
  formatTaxes,
  formatTemp,
  formatTime,
} from '../game/format'

describe('formatMoney', () => {
  it('formats raw amounts below 10k to 2 decimals', () => {
    expect(formatMoney(0)).toBe('0')
    expect(formatMoney(500)).toBe('500')
    expect(formatMoney(1234.567)).toBe('1234.57')
    expect(formatMoney(9999.99)).toBe('9999.99')
  })

  it('uses absolute value (negative costs render positive)', () => {
    expect(formatMoney(-500)).toBe('500')
    expect(formatMoney(-2500000)).toBe('2.5M')
  })

  it('scales into k / M / b / t / Q buckets', () => {
    expect(formatMoney(15000)).toBe('15k')
    expect(formatMoney(1500000)).toBe('1.5M')
    expect(formatMoney(2500000000)).toBe('2.5b')
    expect(formatMoney(3000000000000)).toBe('3t')
    expect(formatMoney(5000000000000000)).toBe('5Q')
  })

  it('rounds scaled values to 2 decimals', () => {
    expect(formatMoney(1234567)).toBe('1.23M')
  })
})

describe('formatTime', () => {
  it('shows seconds below 120', () => {
    expect(formatTime(0)).toBe('0s')
    expect(formatTime(45)).toBe('45s')
    expect(formatTime(119)).toBe('119s')
  })

  it('shows minutes below 7200', () => {
    expect(formatTime(120)).toBe('2m')
    expect(formatTime(7199)).toBe('120m')
  })

  it('shows hours from 7200 up', () => {
    expect(formatTime(7200)).toBe('2h')
    expect(formatTime(36000)).toBe('10h')
  })
})

describe('formatDigested', () => {
  it('shows rounded raw litres below 1000', () => {
    expect(formatDigested(0)).toBe('0l')
    expect(formatDigested(500.4)).toBe('500l')
    expect(formatDigested(999)).toBe('999l')
  })

  it('scales to "k" (value/60) below 7200', () => {
    expect(formatDigested(1000)).toBe('16.67kl')
  })

  it('scales to "M" (value/3600) from 7200 up', () => {
    expect(formatDigested(7200)).toBe('2Ml')
  })
})

describe('formatTemp', () => {
  it('formats celsius and fahrenheit to 1 dp', () => {
    expect(formatTemp(36.6)).toBe('36.6C (97.9F)')
    expect(formatTemp(40)).toBe('40C (104F)')
  })
})

describe('formatTaxes', () => {
  it('formats tax relief percentage', () => {
    expect(formatTaxes(0.4)).toBe('60')
    expect(formatTaxes(1)).toBe('0')
  })
})
