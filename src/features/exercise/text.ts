import type { LoggedSet, Target } from '../../builder';

const kg = (w: number) => `${w} kg`;

/** "3 × 6 @ 60 kg", "3 × 12" (bodyweight), "3 × 5 · set weight", "25 min", "4 × 8". */
export function targetText(t: Target): string {
  if (t.minutes !== null) return t.sets > 1 ? `${t.sets} × ${t.minutes} min` : `${t.minutes} min`;
  const base = `${t.sets} × ${t.reps}`;
  if (t.needsWeight) return `${base} · set weight`;
  return t.weight ? `${base} @ ${kg(t.weight)}` : base;
}

/** One set or a day's sets in short form: "60 kg × 8", "12 reps", "25 min". */
export function setText(s: LoggedSet): string {
  if (s.seconds !== null) return `${Math.round(s.seconds / 60)} min`;
  return s.weight ? `${kg(s.weight)} × ${s.reps}` : `${s.reps} reps`;
}

/** What was done tonight, like the target: "3 × 6 @ 60 kg", "2 × 12", "25 min". */
export function doneText(sets: LoggedSet[]): string {
  const first = sets[0];
  if (!first) return '';
  if (first.seconds !== null) return setText(first);
  const base = `${sets.length} × ${first.reps}`;
  return first.weight ? `${base} @ ${kg(first.weight)}` : base;
}

/** "Last: 9 days ago · 60 kg × 8", "Last: yesterday · 12 reps", or "Never done". */
export function lastText(last: { days: number; sets: LoggedSet[] } | null): string {
  if (!last) return 'Never done';
  const when = last.days === 1 ? 'yesterday' : `${last.days} days ago`;
  return `Last: ${when} · ${setText(last.sets[0])}`;
}
