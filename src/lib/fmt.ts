/** Format a date as "April 19, 2025" */
export function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Format a date as "Apr 2025" */
export function fmtDateShort(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}
