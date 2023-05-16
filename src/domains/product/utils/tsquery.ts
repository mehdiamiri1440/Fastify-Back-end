export function toTsQuery(input: string): string {
  // Remove non-alphanumeric characters
  const alphanumeric = input.replace(/[^a-zA-Z0-9\s]/g, '');

  // Split by space and join with '|'
  const tsQuery = alphanumeric
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => !!s)
    .join(' | ');

  return tsQuery;
}
