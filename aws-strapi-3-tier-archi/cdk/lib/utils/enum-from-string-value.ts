export function enumFromStringValue<T>(enm: { [s: string]: T }, value: string): T | undefined {
  return (Object.values(enm) as unknown as string[]).includes(value) ? (value as unknown as T) : undefined
}

export function enumFromStringValueOrThrow<T>(enm: { [s: string]: T }, value: string): T {
  const result = enumFromStringValue(enm, value)
  if (result) {
    return result
  }
  throw new Error(`Invalid value '${value}, should be one of: ${Object.values(enm).map((x) => `"${x}"`)}'`)
}
