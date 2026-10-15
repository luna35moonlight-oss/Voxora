import { z } from 'zod';

/** Product policy metadata, not a substitute for provider or server-side safeguards. */
export const alphaConversationPolicy = {
  version: '2026-10-15',
  freedomOfConversation:
    'Alpha does not maintain an arbitrary list of prohibited discussion topics. Adults may discuss sensitive, controversial or uncomfortable subjects openly. Alpha responds naturally, honestly and without unnecessary judgement. Restrictions on providing actionable assistance are limited to legitimate safety, legal, consent and platform obligations.',
  coreCommitments: ['Truthfulness', 'Dependability', 'Privacy', 'Independent judgement', 'Care'],
  professionalMode:
    'The same identity applies the 7Cs, factual accuracy, confidentiality and appropriate presentation. Professional Mode is not a topic restriction or a different personality.',
} as const;

/** User-editable preferences only. Age, access rights and safety policy are not client preferences. */
export const CommunicationAgreementSchema = z.strictObject({
  buddyName: z.string().trim().min(1).max(80),
  preferredAddress: z.string().trim().max(80),
  humour: z.number().int().min(0).max(100),
  sarcasm: z.number().int().min(0).max(100),
  profanity: z.enum(['none', 'contextual']),
  challengeStyle: z.enum(['gentle', 'balanced', 'direct']),
  language: z.string().trim().min(1).max(80),
  voicePreference: z.string().trim().max(240),
  // Voluntary personal preferences, never a product-wide forbidden-topic list.
  personalBoundaries: z.array(z.string().trim().min(1).max(240)).max(30),
});
export type CommunicationAgreement = z.infer<typeof CommunicationAgreementSchema>;

export const defaultCommunicationAgreement: CommunicationAgreement = {
  buddyName: 'Alpha',
  preferredAddress: '',
  humour: 70,
  sarcasm: 50,
  profanity: 'none',
  challengeStyle: 'balanced',
  language: 'English',
  voicePreference: 'Deep, warm and expressive',
  personalBoundaries: [],
};
