import Link from "next/link";

const STEPS = [
  { href: "/custom-projects/start", label: "Details" },
  { href: "/custom-projects/features", label: "Features & files" },
  { href: "/custom-projects/estimate", label: "Estimate" },
  { href: "/custom-projects/checkout", label: "Payment" },
];

export default function StepBar({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-xs">
      {STEPS.map((s, i) => (
        <li key={s.href}>
          {i <= current ? (
            <Link
              href={s.href}
              className={i === current ? "font-semibold text-navy" : "text-slate underline hover:text-navy"}
            >
              {i + 1}. {s.label}
            </Link>
          ) : (
            <span className="text-slate/60">
              {i + 1}. {s.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
