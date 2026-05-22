import type { Priority } from '@/types';
import { PRIORITY_CONFIG } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
}

export function PriorityBadge({ priority, showLabel = true }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <Badge color={cfg.color} bg={cfg.bgColor}>
      {priority}{showLabel && ` · ${cfg.label}`}
    </Badge>
  );
}

export function PriorityStripe({ priority }: { priority: Priority }) {
  return (
    <div
      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-card"
      style={{ background: PRIORITY_CONFIG[priority].color }}
    />
  );
}
