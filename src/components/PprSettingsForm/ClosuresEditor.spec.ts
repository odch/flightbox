import { upcomingClosures } from './ClosuresEditor';

describe('upcomingClosures', () => {
  const today = '2026-11-14';
  const ended = { from: '2026-11-01', to: '2026-11-13', reason: 'Camp' };
  const endsToday = { from: '2026-11-10', to: '2026-11-14', reason: 'Runway works' };
  const later = { from: '2026-12-24', to: '2026-12-26', reason: 'Christmas' };

  it('keeps the closures that end today or later, in their order', () => {
    expect(upcomingClosures([later, ended, endsToday], today)).toEqual([later, endsToday]);
  });

  it('leaves out closures without a last day', () => {
    expect(upcomingClosures([{ from: '2026-12-01', to: null, reason: 'Event' }], today)).toEqual([]);
  });

  it('is empty without closures', () => {
    expect(upcomingClosures([], today)).toEqual([]);
    expect(upcomingClosures(null, today)).toEqual([]);
    expect(upcomingClosures(undefined, today)).toEqual([]);
  });
});
