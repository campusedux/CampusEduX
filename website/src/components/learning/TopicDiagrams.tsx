export interface TopicTableDiagram {
  kind: "table";
  caption: string;
  description: string;
  columns: string[];
  rows: string[][];
}

export interface WeakEntityDiagram {
  kind: "weak-entity-er";
  caption: string;
  description: string;
  owner: string;
  ownerKey: string;
  relationship: string;
  dependent: string;
  partialKey: string;
}

type TopicDiagram = TopicTableDiagram | WeakEntityDiagram;

/** Optional editorial metadata; malformed/unrelated metadata is not executable. */
export function topicDiagrams(metadata?: Record<string, unknown>): TopicDiagram[] {
  const value = metadata?.dbms_diagrams_v1;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TopicDiagram => {
    if (!item || typeof item !== "object") return false;
    if (typeof item.caption !== "string" || typeof item.description !== "string") return false;
    if (item.kind === "weak-entity-er") return [item.owner, item.ownerKey, item.relationship, item.dependent, item.partialKey]
      .every((label) => typeof label === "string" && label.trim().length > 0 && label.length <= 32);
    if (item.kind !== "table") return false;
    return Array.isArray(item.columns) && item.columns.length > 0 && item.columns.every((column: unknown) => typeof column === "string") &&
      Array.isArray(item.rows) && item.rows.every((row: unknown) => Array.isArray(row) && row.length === item.columns.length && row.every((cell: unknown) => typeof cell === "string"));
  });
}

function WeakEntityER({ diagram }: { diagram: WeakEntityDiagram }) {
  return <svg viewBox="0 0 900 340" role="img" aria-label={`${diagram.caption}. ${diagram.description}`} className="min-w-[720px] w-full text-ink">
    <title>{diagram.caption}</title>
    <desc>{diagram.description}</desc>
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="50" y="140" width="200" height="70" />
      <rect x="650" y="140" width="200" height="70" />
      <rect x="656" y="146" width="188" height="58" />
      <path d="M350 175 L450 115 L550 175 L450 235 Z" />
      <path d="M362 175 L450 123 L538 175 L450 227 Z" />
      <path d="M250 175 H350 M543 171 H650 M543 179 H650" />
      <ellipse cx="150" cy="55" rx="105" ry="28" />
      <ellipse cx="750" cy="55" rx="105" ry="28" />
      <path d="M150 83 V140 M750 83 V140 M90 65 H210" />
      <path d="M690 65 H810" strokeDasharray="5 4" />
    </g>
    <g fill="currentColor" fontSize="16" textAnchor="middle">
      <text x="150" y="60">{diagram.ownerKey}</text>
      <text x="750" y="60">{diagram.partialKey}</text>
      <text x="150" y="180">{diagram.owner}</text>
      <text x="450" y="180">{diagram.relationship}</text>
      <text x="750" y="180">{diagram.dependent}</text>
      <text x="300" y="155">1</text><text x="600" y="150">N</text>
      <text x="150" y="260">Owner: 0..N dependents</text>
      <text x="750" y="260">Dependent: exactly 1 owner</text>
      <text x="450" y="300">Single owner line: partial participation. Double dependent line: total participation.</text>
      <text x="450" y="325">Solid underline: owner key. Dashed underline: partial key, unique within one owner.</text>
    </g>
  </svg>;
}

export function TopicDiagrams({ metadata }: { metadata?: Record<string, unknown> }) {
  return <>{topicDiagrams(metadata).map((diagram, index) => (
    <figure key={index} className="my-6 min-w-0 rounded-xl border border-line bg-card p-4">
      <figcaption className="font-semibold text-ink">{diagram.caption}</figcaption>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{diagram.description}</p>
      <div role="region" aria-label={`${diagram.caption} ${diagram.kind === "table" ? "table" : "ER diagram"}`} tabIndex={0} className="mt-3 max-w-full overflow-x-auto rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
        {diagram.kind === "weak-entity-er" ? <WeakEntityER diagram={diagram} /> : <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{diagram.caption}. {diagram.description}</caption>
          <thead><tr>{diagram.columns.map((column, i) => <th key={i} scope="col" className="border-b border-line p-3 align-top font-semibold text-ink">{column}</th>)}</tr></thead>
          <tbody>{diagram.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ?
            <th key={j} scope="row" className="border-b border-line p-3 align-top font-medium text-ink">{cell}</th> :
            <td key={j} className="border-b border-line p-3 align-top text-ink-muted">{cell}</td>)}</tr>)}</tbody>
        </table>}
      </div>
    </figure>
  ))}</>;
}
