import formatUpdatedBy from './formatUpdatedBy';

describe('formatUpdatedBy', () => {
  it('returns "name (email)" when both name and email are present', () => {
    expect(formatUpdatedBy({
      firstname: 'Hans',
      lastname: 'Meier',
      email: 'hans@example.ch',
      uid: 'uid-1',
      by: 'Hans Meier',
    })).toEqual('Hans Meier (hans@example.ch)');
  });

  it('returns just the name when email is missing', () => {
    expect(formatUpdatedBy({
      firstname: 'Hans',
      lastname: 'Meier',
      uid: 'uid-1',
      by: 'uid-1',
    })).toEqual('Hans Meier');
  });

  it('returns the email when name parts are missing', () => {
    expect(formatUpdatedBy({
      firstname: null,
      lastname: null,
      email: 'hans@example.ch',
      uid: 'uid-1',
      by: 'uid-1',
    })).toEqual('hans@example.ch');
  });

  it('returns the uid when name and email are missing on a new record', () => {
    expect(formatUpdatedBy({
      firstname: null,
      lastname: null,
      email: null,
      uid: 'uid-1',
      by: 'uid-1',
    })).toEqual('uid-1');
  });

  it('falls back to `by` for a legacy record with no uid', () => {
    expect(formatUpdatedBy({
      by: 'Some Old Admin',
    })).toEqual('Some Old Admin');
  });

  it('returns null when nothing is usable', () => {
    expect(formatUpdatedBy({})).toBeNull();
  });

  it('treats empty / whitespace name parts as missing', () => {
    expect(formatUpdatedBy({
      firstname: '   ',
      lastname: '',
      email: 'hans@example.ch',
    })).toEqual('hans@example.ch');
  });

  it('returns only firstname when lastname is missing', () => {
    expect(formatUpdatedBy({
      firstname: 'Hans',
      lastname: null,
    })).toEqual('Hans');
  });
});
