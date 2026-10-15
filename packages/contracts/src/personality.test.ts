import { describe, expect, it } from 'vitest';
import { CommunicationAgreementSchema } from './personality';

const agreement = {
  buddyName: 'Alpha',
  preferredAddress: 'Luna',
  humour: 70,
  sarcasm: 50,
  profanity: 'contextual',
  challengeStyle: 'balanced',
  language: 'English',
  voicePreference: 'Deep, warm and expressive',
  personalBoundaries: ['Do not call me bro'],
};
describe('communication agreement boundary', () => {
  it('accepts user-controlled style and preserves explicit personal boundaries', () => {
    expect(CommunicationAgreementSchema.parse(agreement).personalBoundaries).toEqual([
      'Do not call me bro',
    ]);
  });
  it('rejects preference payloads attempting to grant access or disable protections', () => {
    for (const injected of [
      { safetyDisabled: true },
      { adultVerified: true },
      { sharedRoomAccess: '*' },
    ]) {
      expect(() => CommunicationAgreementSchema.parse({ ...agreement, ...injected })).toThrow();
    }
  });
  it('rejects out-of-range values and unbounded or empty input', () => {
    for (const changed of [
      { humour: 101 },
      { sarcasm: -1 },
      { buddyName: ' ' },
      { personalBoundaries: [''] },
      { preferredAddress: 'x'.repeat(81) },
    ]) {
      expect(() => CommunicationAgreementSchema.parse({ ...agreement, ...changed })).toThrow();
    }
  });
});
