/** Only the verified combined course uses this presentation policy. */
export const DBMS_SQL_SLUG = "dbms-sql-tutorial";

export function databaseGroupName(gridSlug: string, name: string): string {
  return gridSlug === DBMS_SQL_SLUG
    ? name.replace(/^(?:chapter|unit|module|lesson|part|section)\s+\d+\s*[:.\-–—]\s*/i, "")
    : name;
}
