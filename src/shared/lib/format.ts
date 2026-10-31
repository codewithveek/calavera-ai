const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : fractionDigits)} ${BYTE_UNITS[exponent]}`;
}

export function formatPercent(fraction: number): string {
  const clamped = Math.max(0, Math.min(1, fraction));
  return `${Math.floor(clamped * 100)}%`;
}

export function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—';
  const seconds = Math.round(totalSeconds);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function formatDate(epochMs: number): string {
  return DATE_FORMAT.format(new Date(epochMs));
}

export function bytesToGiB(bytes: number): number {
  return bytes / 1024 ** 3;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "Abuela Rosa Núñez" → "abuela-rosa-nunez": ASCII, lowercase, hyphenated (file names). */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
