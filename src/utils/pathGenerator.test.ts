import { describe, it, expect } from 'vitest'
import { generatePath, getJsonType, isPrimitive } from './pathGenerator'

describe('pathGenerator', () => {
  describe('generatePath', () => {
    it('should generate JMESPath for simple object keys', () => {
      const segments = [
        { key: 'user', isArrayIndex: false },
        { key: 'name', isArrayIndex: false },
      ]
      expect(generatePath(segments, 'jmespath')).toBe('user.name')
    })

    it('should generate path with array index', () => {
      const segments = [
        { key: 'users', isArrayIndex: false },
        { key: '0', isArrayIndex: true },
        { key: 'name', isArrayIndex: false },
      ]
      expect(generatePath(segments, 'jmespath')).toBe('users[0].name')
    })

    it('should generate JSONPath with $ prefix', () => {
      const segments = [
        { key: 'user', isArrayIndex: false },
        { key: 'name', isArrayIndex: false },
      ]
      expect(generatePath(segments, 'jsonpath')).toBe("$['user']['name']")
    })

    it('should handle keys with special characters in JMESPath', () => {
      const segments = [
        { key: 'user-info', isArrayIndex: false },
        { key: 'first.name', isArrayIndex: false },
      ]
      const path = generatePath(segments, 'jmespath')
      expect(path).toContain('"')
    })

    it('should return empty string for empty segments', () => {
      expect(generatePath([], 'jmespath')).toBe('')
    })
  })

  describe('getJsonType', () => {
    it('should correctly identify null', () => {
      expect(getJsonType(null)).toBe('null')
    })

    it('should correctly identify array', () => {
      expect(getJsonType([1, 2, 3])).toBe('array')
    })

    it('should correctly identify object', () => {
      expect(getJsonType({ key: 'value' })).toBe('object')
    })

    it('should correctly identify string', () => {
      expect(getJsonType('hello')).toBe('string')
    })

    it('should correctly identify number', () => {
      expect(getJsonType(42)).toBe('number')
    })

    it('should correctly identify boolean', () => {
      expect(getJsonType(true)).toBe('boolean')
    })
  })

  describe('isPrimitive', () => {
    it('should return true for null', () => {
      expect(isPrimitive(null)).toBe(true)
    })

    it('should return true for string', () => {
      expect(isPrimitive('hello')).toBe(true)
    })

    it('should return true for number', () => {
      expect(isPrimitive(42)).toBe(true)
    })

    it('should return true for boolean', () => {
      expect(isPrimitive(true)).toBe(true)
    })

    it('should return false for object', () => {
      expect(isPrimitive({})).toBe(false)
    })

    it('should return false for array', () => {
      expect(isPrimitive([])).toBe(false)
    })
  })
})
