import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        active: "bg-success/10 text-success",
        inactive: "bg-muted text-muted-foreground",
        draft: "bg-warning/10 text-warning",
        running: "bg-info/10 text-info",
        completed: "bg-success/10 text-success",
        failed: "bg-destructive/10 text-destructive",
        pending: "bg-warning/10 text-warning",
        approved: "bg-success/10 text-success",
        rejected: "bg-destructive/10 text-destructive",
        passed: "bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "active",
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant }), className)}>
      {children}
    </span>
  );
}
