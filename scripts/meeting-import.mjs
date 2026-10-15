#!/usr/bin/env node
import { open } from 'node:fs/promises';
import { extname } from 'node:path';
import { createHash } from 'node:crypto';
import { importTranscript, MAX_TRANSCRIPT_BYTES } from './meetings/transcript.mjs';

try {
  if (process.argv.length !== 3)
    throw new Error('Usage: node scripts/meeting-import.mjs transcript.vtt > review.json');
  const file = await open(process.argv[2], 'r');
  let buffer;
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > MAX_TRANSCRIPT_BYTES)
      throw new Error('Input must be a regular file no larger than 2 MiB');
    buffer = Buffer.alloc(MAX_TRANSCRIPT_BYTES + 1);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    buffer = buffer.subarray(0, bytesRead);
    if (bytesRead > MAX_TRANSCRIPT_BYTES) throw new Error('Input exceeds 2 MiB');
  } finally {
    await file.close();
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  const transcript = importTranscript(text, extname(process.argv[2]).slice(1).toLowerCase());
  console.log(
    JSON.stringify(
      {
        sourceSha256: createHash('sha256').update(buffer).digest('hex'),
        transcript,
        minutes: {
          title: '',
          date: '',
          time: '',
          platform: '',
          attendees: [],
          decisions: [],
          actions: [],
          unresolved: [],
        },
        status: 'awaiting_manual_or_connected_model_preparation',
        notice:
          'Imported source only. No AI summary, transcription, account connection or email sending occurred.',
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Transcript import failed');
  process.exitCode = 1;
}
