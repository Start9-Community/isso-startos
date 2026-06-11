export const DEFAULT_LANG = 'en_US'

const dict = {
  // interfaces.ts + main.ts
  'Isso Server': 1,
  'The Isso commenting server. Embed comments from this address and moderate them at /admin.': 2,

  // main.ts health check
  'The Isso server is ready': 10,
  'The Isso server is starting': 11,
} as const

export type LangDict = Record<keyof typeof dict, string>

export default dict
