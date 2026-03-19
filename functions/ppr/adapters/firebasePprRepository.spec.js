'use strict'

const mockPush = jest.fn()
const mockOnce = jest.fn()
const mockOrderByChild = jest.fn()
const mockEqualTo = jest.fn()
const mockChild = jest.fn()
const mockTransaction = jest.fn()

jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn(() => ({
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
      transaction: mockTransaction
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

  // Like the SDK: the update function may first get null (value not known
  // yet); returning null makes the server answer with its value, and the
  // function runs again. Returning undefined aborts.
  function serverTransaction(serverValue) {
    return async updateFn => {
      let result = updateFn(null)
      if (serverValue !== null) {
        result = updateFn(serverValue)
      }
      if (result === undefined) {
        return { committed: false, snapshot: { val: () => serverValue } }
      }
      return { committed: true, snapshot: { val: () => result } }
    }
  }

  describe('updateIf', () => {
    it('applies the data when the predicate holds', async () => {
      mockTransaction.mockImplementation(serverTransaction({ status: 'pending', firstname: 'Max' }))
      const predicate = jest.fn(request => request.status === 'pending')

      const result = await repository.updateIf('abc123', predicate, { status: 'approved' })

      expect(mockChild).toHaveBeenCalledWith('abc123')
      expect(predicate).toHaveBeenCalledWith({ key: 'abc123', status: 'pending', firstname: 'Max' })
      expect(result).toEqual({
        applied: true,
        request: { key: 'abc123', status: 'approved', firstname: 'Max' }
      })
    })

    it('leaves the request unchanged when the predicate fails', async () => {
      mockTransaction.mockImplementation(serverTransaction({ status: 'rejected' }))

      const result = await repository.updateIf('abc123', () => false, { status: 'approved' })

      expect(result).toEqual({ applied: false, request: { key: 'abc123', status: 'rejected' } })
    })

    it('reports a missing request without creating it', async () => {
      mockTransaction.mockImplementation(serverTransaction(null))
      const predicate = jest.fn(() => true)

      const result = await repository.updateIf('missing', predicate, { status: 'approved' })

      expect(predicate).not.toHaveBeenCalled()
      expect(result).toEqual({ applied: false, request: null })
    })
  })

  describe('removeIf', () => {
    it('deletes the request when the predicate holds', async () => {
      mockTransaction.mockImplementation(serverTransaction({ status: 'pending' }))

      const result = await repository.removeIf('abc123', () => true)

      expect(result).toEqual({ applied: true, request: { key: 'abc123', status: 'pending' } })
    })

    it('keeps the request when the predicate fails', async () => {
      mockTransaction.mockImplementation(serverTransaction({ status: 'approved' }))

      const result = await repository.removeIf('abc123', () => false)

      expect(result).toEqual({ applied: false, request: { key: 'abc123', status: 'approved' } })
    })

    it('reports a missing request', async () => {
      mockTransaction.mockImplementation(serverTransaction(null))

      const result = await repository.removeIf('missing', () => true)

      expect(result).toEqual({ applied: false, request: null })
    })
  })
})
