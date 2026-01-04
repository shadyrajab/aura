export function getCurrentDateSaoPaulo(): Date {
  return new Date();
}

export function formatRelativeTime(date: Date | null): string {
  if (!date) {
    return "Nunca";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return "agora";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}min atrás`;
  } else if (diffHours < 24) {
    return `${diffHours}h atrás`;
  } else if (diffDays < 7) {
    return `${diffDays}d atrás`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}sem atrás`;
  } else if (diffMonths < 12) {
    return `${diffMonths}meses atrás`;
  } else {
    return `${diffYears}ano${diffYears > 1 ? "s" : ""} atrás`;
  }
}

