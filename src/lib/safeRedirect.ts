export function safeRedirectPath(value: string | null | undefined, fallback = '/discover'): string {
  if (!value) return fallback;
  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\') || candidate.includes('\r') || candidate.includes('\n')) return fallback;
  try {
    const parsed = new URL(candidate, 'https://avalon.local');
    if (parsed.origin !== 'https://avalon.local') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
