import type { LucideIcon } from "lucide-react";
import {
  ShieldCheck,
  Users,
  LayoutDashboard,
  CreditCard,
  Bell,
  Image as ImageIcon,
  Search as SearchIcon,
  Radio,
  MapPin,
  Sparkles,
  BarChart3,
  Plug,
  Lock,
  Rocket,
  FileText,
  Workflow,
} from "lucide-react";
import { formatINR } from "@/lib/format";
import { Badge, Switch } from "@/components/ui";
import type { FeatureRow } from "@/lib/customProjects";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Authentication: ShieldCheck,
  "User Management": Users,
  Admin: LayoutDashboard,
  Payments: CreditCard,
  Notifications: Bell,
  Media: ImageIcon,
  Search: SearchIcon,
  "Real-time": Radio,
  Location: MapPin,
  AI: Sparkles,
  Analytics: BarChart3,
  Integrations: Plug,
  Security: Lock,
  Deployment: Rocket,
  Documentation: FileText,
  Automation: Workflow,
};

/**
 * The one feature-row card used by Included Features, Extra Features, the
 * "Add extra feature" browser, and (read-only) the Estimate/Payment
 * summaries — a single source of truth for the look (spec: one card design).
 */
export function FeatureCard({
  feature,
  checked,
  onToggle,
  recommended,
  readOnly,
}: {
  feature: FeatureRow;
  checked: boolean;
  onToggle?: () => void;
  recommended?: boolean;
  readOnly?: boolean;
}) {
  const Icon = CATEGORY_ICON[feature.category] ?? Sparkles;
  const price = Number(feature.price) || 0;

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{feature.name}</span>
          {recommended && <Badge tone="primary">Recommended</Badge>}
        </div>
        {feature.description && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{feature.description}</p>}
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        {price > 0 && <span className="text-sm font-semibold text-ink">+{formatINR(price)}</span>}
        {readOnly ? (
          <span
            className={
              "whitespace-nowrap rounded-full px-2.5 py-1 text-[0.7rem] font-semibold " +
              (checked ? "bg-success/10 text-success" : "bg-surface text-ink-faint")
            }
          >
            {checked ? "Included" : "Not selected"}
          </span>
        ) : (
          <Switch checked={checked} onChange={() => onToggle?.()} label={`Toggle ${feature.name}`} />
        )}
      </div>
    </div>
  );
}

export default FeatureCard;
