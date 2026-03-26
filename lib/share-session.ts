/** Last display name used on the shared-bill join flow (per receipt). */
export function splitShareDisplayNameKey(receiptId: string): string {
  return `split-display-name-${receiptId}`
}
