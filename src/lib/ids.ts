/** Parse a positive whole-number ID from text. Returns null if it is not one. */
export function parseId(value: string | null | undefined): number | null {
  if (!value || !/^[0-9]+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
