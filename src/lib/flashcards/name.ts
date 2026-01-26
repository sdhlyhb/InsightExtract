/**
 * Generate unique CSV filename tied to uploaded file
 */

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

/**
 * Generate simple hash from string (for stable naming)
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Generate flashcard CSV filename
 * Format: <base>-flashcards-YYYYMMDD-HHmmss-<hash>.csv
 * Example: ethics-handbook-v3-flashcards-20260124-223105-a1b2c3.csv
 */
export function makeFlashcardCsvName(
  sourceFilename: string,
  contentForHash: string,
): string {
  // Extract base name without extension
  const baseName = sourceFilename.replace(/\.(pdf|docx?)$/i, "");
  const kebabBase = toKebabCase(baseName);

  // Generate timestamp: YYYYMMDD-HHmmss
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;

  // Generate hash from content
  const hash = simpleHash(contentForHash);

  return `${kebabBase}-flashcards-${timestamp}-${hash}.csv`;
}
