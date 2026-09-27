import { CheckCircle2 } from "lucide-react";
import { formatINRExact as formatINR } from "@/lib/format";
import { PAYMENT_STATUS_LABELS, type CustomProjectAddon, type CustomProjectAmounts } from "@/lib/customProjects";

/**
 * Base value + accepted add-ons = total, − paid (− credits) = due. Every figure comes from
 * public.custom_project_amounts(); nothing is computed here. Once fully paid the due line disappears.
 */
export function PriceBreakdown({
  amounts,
  acceptedAddons,
  estimatedTotal,
}: {
  amounts: CustomProjectAmounts;
  acceptedAddons: CustomProjectAddon[];
  estimatedTotal: number;
}) {
  const paid = amounts.paymentStatus === "paid";
  return (
    <dl className="space-y-2 text-ink-muted">
      <div className="flex justify-between">
        <dt>Base project value</dt>
        <dd className="text-ink">{formatINR(amounts.baseValue)}</dd>
      </div>
      {amounts.baseValue !== Number(estimatedTotal) && (
        <p className="text-xs text-ink-faint">Adjusted from the {formatINR(estimatedTotal)} estimate after review.</p>
      )}
      {acceptedAddons.map((a) => (
        <div key={a.id} className="flex justify-between gap-3">
          <dt className="min-w-0 truncate">+ {a.title}</dt>
          <dd className="text-ink">{formatINR(a.price ?? 0)}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink">
        <dt>Total project value</dt>
        <dd>{formatINR(amounts.projectValue)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>Paid</dt>
        <dd className="text-ink">− {formatINR(amounts.paymentsTotal)}</dd>
      </div>
      {amounts.creditsTotal > 0 && (
        <div className="flex justify-between">
          <dt>Credits</dt>
          <dd className="text-ink">− {formatINR(amounts.creditsTotal)}</dd>
        </div>
      )}
      {paid ? (
        <div className="flex items-center justify-between rounded-xl bg-success/10 px-3 py-2 font-semibold text-success">
          <dt className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Payment status
          </dt>
          <dd>{PAYMENT_STATUS_LABELS.paid}</dd>
        </div>
      ) : (
        <div className="flex justify-between rounded-xl bg-warning/10 px-3 py-2 font-semibold text-ink">
          <dt>Due · {PAYMENT_STATUS_LABELS[amounts.paymentStatus]}</dt>
          <dd>{formatINR(amounts.due)}</dd>
        </div>
      )}
    </dl>
  );
}

export default PriceBreakdown;
