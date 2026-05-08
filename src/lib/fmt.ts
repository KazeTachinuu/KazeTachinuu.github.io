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

/** Format a date as "April 19th, 2025" — ordinal day, Josh Comeau style */
export function fmtDateOrdinal(d: Date | string): string {
  const date = new Date(d);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}${ordinal(day)}, ${year}`;
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
