export const MAX_TRANSCRIPT_BYTES = 2 * 1024 * 1024;
/** Deterministic import, not transcription or AI interpretation. Originals stay untouched. */
export function importTranscript(text, format) {
  if (!['txt', 'vtt', 'srt'].includes(format)) throw new Error('Supported inputs: TXT, VTT, SRT');
  if (Buffer.byteLength(text, 'utf8') > MAX_TRANSCRIPT_BYTES)
    throw new Error('Transcript exceeds 2 MiB');
  if (text.includes('\0') || text.includes('\uFFFD')) throw new Error('Expected valid UTF-8 text');
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .split('\n');
  const segments = [];
  if (format === 'txt') {
    lines.forEach((line, index) => {
      if (line.trim())
        segments.push({ id: `line-${index + 1}`, sourceLine: index + 1, text: line });
    });
  } else {
    const time = '(?:\\d{2,}:)?[0-5]\\d:[0-5]\\d[.,]\\d{3}';
    const timing = new RegExp(`^(${time})\\s+-->\\s+(${time})(?:\\s+.*)?$`);
    const seconds = (value) =>
      value
        .replace(',', '.')
        .split(':')
        .reduce((sum, part) => sum * 60 + Number(part), 0);
    for (let index = 0; index < lines.length; index++) {
      const match = timing.exec(lines[index].trim());
      if (!match) {
        if (lines[index].includes('-->')) throw new Error(`Invalid timestamp at line ${index + 1}`);
        const line = lines[index].trim();
        // Headers and cue identifiers are allowed; non-cue text is not silently discarded.
        if (!line || (index === 0 && /^WEBVTT(?:\s.*)?$/.test(line))) continue;
        if (/^(NOTE|STYLE|REGION)(\s|$)/.test(line)) {
          while (index + 1 < lines.length && lines[index + 1].trim()) index++;
          continue;
        }
        if (index + 1 < lines.length && timing.test(lines[index + 1].trim())) continue;
        throw new Error(`Unrecognised timed transcript content at line ${index + 1}`);
      }
      if (seconds(match[2]) <= seconds(match[1])) throw new Error('Cue end must follow start');
      const sourceLine = index + 1;
      const content = [];
      while (index + 1 < lines.length && lines[index + 1].trim()) {
        const line = lines[++index];
        if (line.includes('-->')) throw new Error('Separate cues with a blank line');
        content.push(line);
      }
      if (!content.length) throw new Error('Empty transcript cue');
      segments.push({
        id: `cue-${segments.length + 1}`,
        sourceLine,
        start: match[1],
        end: match[2],
        text: content.join('\n'),
      });
    }
  }
  if (!segments.length) throw new Error('No transcript content found');
  return { format, segments, interpretation: 'unreviewed_source_text' };
}

/** Structural review only: references cannot prove semantic entailment or factual accuracy. */
export function reviewMinutes(draft, transcript) {
  const issues = [];
  const segments = new Map(transcript.segments.map((segment) => [segment.id, segment.text]));
  for (const field of ['title', 'date', 'time', 'platform']) {
    if (typeof draft[field] !== 'string' || !draft[field].trim())
      issues.push(`Missing meeting ${field}`);
  }
  if (!Array.isArray(draft.attendees) || !draft.attendees.length)
    issues.push('Attendance requires review');
  for (const group of ['decisions', 'actions']) {
    if (!Array.isArray(draft[group])) {
      issues.push(`Missing ${group} register`);
      continue;
    }
    for (const [index, item] of draft[group].entries()) {
      const label = `${group}[${index}]`;
      if (!item || typeof item !== 'object') {
        issues.push(`${label}: invalid entry`);
        continue;
      }
      if (typeof item.text !== 'string' || !item.text.trim()) issues.push(`${label}: missing text`);
      if (!Array.isArray(item.evidence) || !item.evidence.length)
        issues.push(`${label}: missing evidence`);
      else
        for (const reference of item.evidence) {
          const source = segments.get(reference?.segmentId);
          if (
            !source ||
            typeof reference?.quote !== 'string' ||
            !reference.quote.trim() ||
            !source.includes(reference.quote)
          ) {
            issues.push(`${label}: evidence quote does not match source`);
          }
        }
      if (group === 'actions') {
        if (typeof item.owner !== 'string' || !item.owner.trim())
          issues.push(`${label}: owner unconfirmed`);
        if (typeof item.deadline !== 'string' || !item.deadline.trim())
          issues.push(`${label}: deadline unconfirmed`);
        if (!['unresolved', 'carry_forward', 'completed'].includes(item.status))
          issues.push(`${label}: invalid action status`);
      }
    }
  }
  return {
    status: 'human_review_required',
    structuralChecksPassed: issues.length === 0,
    issues,
    notice:
      'Matching quotes are not proof of a decision, owner or deadline. Review meaning, accuracy, language and all 7C principles before approval. Nothing was sent.',
  };
}
