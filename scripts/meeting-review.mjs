#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { reviewMinutes } from './meetings/transcript.mjs';
try {
  if (process.argv.length !== 3)
    throw new Error('Usage: node scripts/meeting-review.mjs review.json');
  const { minutes, transcript } = JSON.parse(await readFile(process.argv[2], 'utf8'));
  const result = reviewMinutes(minutes, transcript);
  console.log(JSON.stringify(result, null, 2));
  if (!result.structuralChecksPassed) process.exitCode = 1;
} catch {
  console.error(
    'Cannot review input: supply a valid imported review JSON with minutes and transcript.',
  );
  process.exitCode = 1;
}
