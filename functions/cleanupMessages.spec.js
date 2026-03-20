'use strict';

let mockRefData = {};
let mockCurrentRefPath = '';

const mockUpdate = jest.fn().mockResolvedValue();
const mockOnce = jest.fn().mockImplementation(() => {
  return Promise.resolve(mockRefData[mockCurrentRefPath] || { exists: () => false, forEach: () => {} });
});
const mockRef = jest.fn().mockImplementation(path => {
  mockCurrentRefPath = path;
  return { once: mockOnce, update: mockUpdate };
});

jest.mock('firebase-admin', () => ({
  database: jest.fn().mockReturnValue({ ref: mockRef }),
  initializeApp: jest.fn(),
}));

jest.mock('firebase-functions', () => ({
  region: jest.fn().mockReturnThis(),
  pubsub: {
    schedule: jest.fn().mockReturnValue({
      timeZone: jest.fn().mockReturnValue({
        onRun: jest.fn(fn => fn),
      }),
    }),
  },
}));

function createSnapshot(data) {
  const entries = Object.entries(data);
  return {
    exists: () => entries.length > 0,
    forEach(cb) {
      entries.forEach(([key, val]) => {
        cb({ key, val: () => val });
      });
    },
  };
}

function createValueSnapshot(val) {
  return { val: () => val };
}

describe('cleanupMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockRefData = {};
    mockCurrentRefPath = '';
  });

  it('should skip when messageRetentionDays is not set', async () => {
    mockRefData['/settings/messageRetentionDays'] = createValueSnapshot(null);

    const { scheduledCleanupMessages } = require('./cleanupMessages');
    await scheduledCleanupMessages();

    expect(mockRef).not.toHaveBeenCalledWith('/messages');
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should delete messages older than configured retention', async () => {
    mockRefData['/settings/messageRetentionDays'] = createValueSnapshot(90);

    const oldTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000);
    const recentTimestamp = Date.now() - (10 * 24 * 60 * 60 * 1000);

    mockRefData['/messages'] = createSnapshot({
      'msg1': { name: 'Old', timestamp: oldTimestamp },
      'msg2': { name: 'Recent', timestamp: recentTimestamp },
    });

    const { scheduledCleanupMessages } = require('./cleanupMessages');
    await scheduledCleanupMessages();

    expect(mockUpdate).toHaveBeenCalled();

    const updates = mockUpdate.mock.calls[0][0];
    expect(updates['msg1']).toBeNull();
    expect(updates['msg2']).toBeUndefined();
  });

  it('should not call update when no messages exist', async () => {
    mockRefData['/settings/messageRetentionDays'] = createValueSnapshot(90);
    mockRefData['/messages'] = { exists: () => false, forEach: () => {} };

    const { scheduledCleanupMessages } = require('./cleanupMessages');
    await scheduledCleanupMessages();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('should not call update when all messages are recent', async () => {
    mockRefData['/settings/messageRetentionDays'] = createValueSnapshot(90);

    const recentTimestamp = Date.now() - (10 * 24 * 60 * 60 * 1000);
    mockRefData['/messages'] = createSnapshot({
      'msg1': { name: 'Recent', timestamp: recentTimestamp },
    });

    const { scheduledCleanupMessages } = require('./cleanupMessages');
    await scheduledCleanupMessages();

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
