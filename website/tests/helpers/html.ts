/** Match semantic attributes on one tag, independent of React's serialization order. */
export function tagWithAttributes(tag: string, attributes: Record<string, string>): RegExp {
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const checks = Object.entries(attributes).map(([name, value]) =>
    `(?=[^>]*\\s${escape(name)}="${escape(value)}")`,
  ).join("");
  return new RegExp(`<${escape(tag)}\\b${checks}[^>]*>`);
}
