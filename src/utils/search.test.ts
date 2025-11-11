import { describe, it, expect } from 'vitest'
import { searchJson } from './search'

describe('searchJson', () => {
  const testData = {
    name: 'John Doe',
    age: 30,
    address: {
      street: '123 Main St',
      city: 'New York',
    },
    hobbies: ['reading', 'coding', 'gaming'],
  }

  it('should return empty array for empty query', () => {
    const results = searchJson(testData, '')
    expect(results).toEqual([])
  })

  it('should find matches in object keys', () => {
    const results = searchJson(testData, 'name')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.matchType === 'key')).toBe(true)
  })

  it('should find matches in string values', () => {
    const results = searchJson(testData, 'John')
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.matchType === 'value')).toBe(true)
  })

  it('should find matches in nested objects', () => {
    const results = searchJson(testData, 'city')
    expect(results.length).toBeGreaterThan(0)
  })

  it('should find matches in array values', () => {
    const results = searchJson(testData, 'reading')
    expect(results.length).toBeGreaterThan(0)
  })

  it('should be case insensitive by default', () => {
    const results = searchJson(testData, 'JOHN')
    expect(results.length).toBeGreaterThan(0)
  })

  it('should be case sensitive when specified', () => {
    const results = searchJson(testData, 'JOHN', { caseSensitive: true })
    expect(results.length).toBe(0)
  })

  it('should find number values', () => {
    const results = searchJson(testData, '30')
    expect(results.length).toBeGreaterThan(0)
  })
})
