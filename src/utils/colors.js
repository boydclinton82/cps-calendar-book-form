/**
 * Get the position-based color class for a user.
 *
 * Users are assigned colors based on their position in the users array:
 * - Position 0 → user-1 (green)
 * - Position 1 → user-2 (magenta)
 * - Position 2 → user-3 (gold)
 * - Position 3 → user-4 (purple)
 * - Position 4 → user-5 (coral)
 * - Position 5 → user-6 (rose)
 *
 * @param {string} userName - The user's name
 * @param {Array<{name: string}>} users - Array of user objects with name property
 * @returns {string} CSS class name (e.g., "user-1", "user-2")
 */
export function getUserColorClass(userName, users) {
  const index = users.findIndex(u => u.name === userName);
  // Position is 1-indexed for CSS classes, fallback to 1 if not found
  const position = index >= 0 ? index + 1 : 1;
  // Cap at 6 (max supported colors)
  const cappedPosition = Math.min(position, 6);
  return `user-${cappedPosition}`;
}
