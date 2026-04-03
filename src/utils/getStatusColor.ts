export type ClaimStatus = 'processing' | 'approved' | 'paid' | 'rejected';

export function getStatusColor(status: ClaimStatus): string {
  switch (status) {
    case 'processing': return 'bg-accent/20 text-accent-foreground border-accent';
    case 'approved': return 'bg-secondary/20 text-secondary border-secondary';
    case 'paid': return 'bg-primary/20 text-primary border-primary';
    case 'rejected': return 'bg-destructive/20 text-destructive border-destructive';
  }
}

export function getStatusLabel(status: ClaimStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
