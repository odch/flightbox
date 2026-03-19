'use strict'

const mockPush = jest.fn()
const mockUpdate = jest.fn()
const mockOnce = jest.fn()
const mockRemove = jest.fn()
const mockOrderByChild = jest.fn()
const mockEqualTo = jest.fn()
const mockChild = jest.fn()

jest.mock('firebase-admin', () => ({
  database: jest.fn(() => ({
    ref: jest.fn(() => ({
      push: mockPush,
      child: mockChild,
      orderByChild: mockOrderByChild
    }))
  }))
}))

const repository = require('./firebasePprRepository')

describe('firebasePprRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockChild.mockReturnValue({
      update: mockUpdate,
      once: mockOnce,
      remove: mockRemove
    })

    mockOrderByChild.mockReturnValue({
      once: mockOnce,
      equalTo: mockEqualTo
    })

    mockEqualTo.mockReturnValue({
      once: mockOnce
    })
  })

  describe('save', () => {
    it('pushes request and returns key', async () => {
      mockPush.mockResolvedValue({ key: 'abc123' })

      const result = await repository.save({ firstname: 'Max' })

      expect(mockPush).toHaveBeenCalledWith({ firstname: 'Max' })
      expect(result).toEqual({ key: 'abc123' })
    })
  })

  describe('updateStatus', () => {
    it('updates the request by key', async () => {
      mockUpdate.mockResolvedValue()

      await repository.updateStatus('abc123', { status: 'approved' })

      expect(mockChild).toHaveBeenCalledWith('abc123')
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'approved' })
    })
  })

  describe('findByKey', () => {
    it('returns request with key when found', async () => {
      mockOnce.mockResolvedValue({
        exists: () => true,
        val: () => ({ firstname: 'Max', status: 'pending' })
      })

      const result = await repository.findByKey('abc123')

      expect(mockChild).toHaveBeenCalledWith('abc123')
      expect(result).toEqual({ key: 'abc123', firstname: 'Max', status: 'pending' })
    })

    it('returns null when not found', async () => {
      mockOnce.mockResolvedValue({
        exists: () => false
      })

      const result = await repository.findByKey('missing')
      expect(result).toBeNull()
    })
  })

  describe('findAll', () => {
    it('returns all requests ordered by negativeTimestamp', async () => {
      const children = [
        { key: 'req-1', val: () => ({ firstname: 'A' }) },
        { key: 'req-2', val: () => ({ firstname: 'B' }) }
      ]
      mockOnce.mockResolvedValue({
        forEach: (cb) => children.forEach(cb)
      })

      const result = await repository.findAll()

      expect(mockOrderByChild).toHaveBeenCalledWith('negativeTimestamp')
      expect(result).toEqual([
        { key: 'req-1', firstname: 'A' },
        { key: 'req-2', firstname: 'B' }
      ])
    })

    it('returns empty array when no requests', async () => {
      mockOnce.mockResolvedValue({
        forEach: () => {}
      })

      const result = await repository.findAll()
      expect(result).toEqual([])
    })
  })

  describe('findByEmail', () => {
    it('filters by createdBy email', async () => {
      const children = [
        { key: 'req-1', val: () => ({ firstname: 'Max' }) }
      ]
      mockOnce.mockResolvedValue({
        forEach: (cb) => children.forEach(cb)
      })

      const result = await repository.findByEmail('max@example.com')

      expect(mockOrderByChild).toHaveBeenCalledWith('createdBy')
      expect(mockEqualTo).toHaveBeenCalledWith('max@example.com')
      expect(result).toEqual([{ key: 'req-1', firstname: 'Max' }])
    })
  })

  describe('deleteByKey', () => {
    it('removes the request by key', async () => {
      mockRemove.mockResolvedValue()

      await repository.deleteByKey('abc123')

      expect(mockChild).toHaveBeenCalledWith('abc123')
      expect(mockRemove).toHaveBeenCalled()
    })
  })
})
