import { describe, expect, it } from '@jest/globals';

import { decodeBackup, encodeBackup, encodePrefix, fromHex, toHex, type BackupHeader } from './format';
import { describeSummary, isSamePerson, parsePayload, summarize, type BackupPayload } from './payload';

const header: BackupHeader = { format: 1, kdf: 'pbkdf2-sha256', iterations: 600_000, salt: 'a1b2c3d4' };

describe('backup file format', () => {
  it('round-trips the header and sealed data', () => {
    const prefix = encodePrefix(header);
    const sealed = Uint8Array.from([1, 2, 3, 250, 255]);
    const decoded = decodeBackup(encodeBackup(prefix, sealed));

    expect(decoded.header).toEqual(header);
    expect(Array.from(decoded.sealed)).toEqual([1, 2, 3, 250, 255]);
    expect(Array.from(decoded.authenticated)).toEqual(Array.from(prefix));
  });

  it('rejects files that are not backups', () => {
    expect(() => decodeBackup(Uint8Array.from([80, 75, 3, 4, 0, 0, 0]))).toThrow('not a Calavera AI backup');
    expect(() => decodeBackup(encodePrefix(header))).toThrow('not a Calavera AI backup');
  });

  it('rejects headers it does not understand', () => {
    const future = encodePrefix({ ...header, format: 2 } as unknown as BackupHeader);
    expect(() => decodeBackup(encodeBackup(future, Uint8Array.from([1])))).toThrow('newer version');
  });

  it('converts bytes to hex and back', () => {
    const bytes = Uint8Array.from([0, 15, 16, 255]);
    expect(toHex(bytes)).toBe('000f10ff');
    expect(Array.from(fromHex('000f10ff'))).toEqual([0, 15, 16, 255]);
    expect(() => fromHex('xyz')).toThrow();
  });
});

const payload: BackupPayload = {
  kind: 'calavera-archive',
  version: 1,
  createdAt: 1,
  people: [
    {
      name: 'Abuela Rosa',
      relation: 'Grandmother',
      lifeSpan: '1941 - 2020',
      essence: 'Seamstress',
      createdAt: 1,
      memories: [
        { source: 'story', body: 'She sang boleros.', createdAt: 1 },
        { source: 'heirloom', body: 'Heirloom: Candle.', createdAt: 2 },
      ],
      ofrenda: [
        { name: 'Candle', description: '', tier: 'inframundo', meaning: '…', memoryIndex: 1, photo: 'AA==', createdAt: 2 },
      ],
      tributes: [],
    },
  ],
};

describe('backup payload', () => {
  it('parses and summarises a backup', () => {
    const parsed = parsePayload(JSON.stringify(payload));
    expect(describeSummary(summarize(parsed))).toBe('Abuela Rosa · 2 memories · 1 heirloom · 0 calaveritas');
  });

  it('rejects damaged or foreign content', () => {
    expect(() => parsePayload('{oops')).toThrow('damaged');
    expect(() => parsePayload(JSON.stringify({ kind: 'other', people: [] }))).toThrow('damaged');
    expect(() => parsePayload(JSON.stringify({ ...payload, version: 2 }))).toThrow('newer version');
  });

  it('recognises a person already on the phone by name and years', () => {
    expect(isSamePerson({ name: ' abuela rosa ', lifeSpan: '1941 - 2020' }, payload.people[0]!)).toBe(true);
    expect(isSamePerson({ name: 'Abuela Rosa', lifeSpan: '1950 - 2020' }, payload.people[0]!)).toBe(false);
  });
});
