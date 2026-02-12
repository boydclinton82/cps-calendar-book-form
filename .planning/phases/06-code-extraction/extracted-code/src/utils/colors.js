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
  const user = users.find(u => u.name === userName);

  // Use colorIndex if available (from admin wizard)
  if (user && user.colorIndex !== undefined) {
    // colorIndex is 0-5, CSS classes are user-1 through user-6
    return `user-${user.colorIndex + 1}`;
  }

  // Fallback: position-based for backwards compatibility
  const index = users.findIndex(u => u.name === userName);
  const position = index >= 0 ? index + 1 : 1;
  return `user-${Math.min(position, 6)}`;
}
