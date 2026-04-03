export function getRiskColor(score: number): string {
  if (score <= 30) return 'text-secondary';
  if (score <= 60) return 'text-accent';
  return 'text-destructive';
}

export function getRiskBgColor(score: number): string {
  if (score <= 30) return 'bg-secondary';
  if (score <= 60) return 'bg-accent';
  return 'bg-destructive';
}

export function getRiskLabel(score: number): string {
  if (score <= 30) return 'Low';
  if (score <= 60) return 'Medium';
  return 'High';
}
