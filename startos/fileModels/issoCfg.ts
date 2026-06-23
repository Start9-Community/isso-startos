import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { configSubpath, dbPath, defaultHost } from '../utils'

// isso.cfg is Python configparser (INI with newline-indented continuation lists
// for `host`). The SDK's FileHelper.ini (the `ini` npm package) can't round-trip
// that — on write it emits `host[]=` / quoted-newline values, and on read it
// turns the indented continuation lines into bogus keys; either way Isso misreads
// it. So we model it with FileHelper.raw plus a small configparser
// serializer/parser, the way lnd-startos handles lnd.conf.
//
// Options and sections Isso supports but we don't expose (e.g. [hash], [markup],
// [rss], or extra [general] keys) are captured verbatim and re-emitted, so hand
// edits over SSH survive our rewrites. Modeled keys always win (enforced values
// included).

// configparser values arrive as strings; coerce with explicit defaults.
const bool = (def: boolean) =>
  z
    .union([
      z.boolean(),
      z.string().transform((s) => s.trim().toLowerCase() === 'true'),
    ])
    .catch(def)

const int = (def: number) =>
  z.union([z.number(), z.string().transform((s) => Number(s))]).catch(def)

const general = z.object({
  // Enforced: the SQLite path is the StartOS mount point, never user-set.
  dbpath: z.literal(dbPath).catch(dbPath),
  // Isso's CORS allowlist: the website origins allowed to embed comments. Stored
  // as a continuation list (parsed to an array); a hand-edited single-line
  // `host = x` parses to a string, so coerce that to [x]. Isso won't start with
  // an empty allowlist, so an empty list falls back to the seeded localhost
  // placeholder (the Websites action always re-appends it).
  host: z
    .union([
      z.array(z.string()),
      z.string().transform((s) => (s.trim() ? [s.trim()] : [])),
    ])
    .catch([])
    .transform((hosts) => (hosts.length ? hosts : [defaultHost])),
  'max-age': z.string().catch('15m'),
  // Set by the Email Notifications action: 'smtp' when configured, else 'stdout'.
  notify: z.enum(['stdout', 'smtp']).catch('stdout'),
  'reply-notifications': bool(false),
  gravatar: bool(false),
  'latest-enabled': bool(false),
})

const admin = z.object({
  // Enforced: the panel is always authenticated. An empty password is never
  // served — the Set Admin Password critical task stops the service until one is
  // set — so there is no reason to ever disable the panel.
  enabled: z.literal(true).catch(true),
  password: z.string().catch(''),
})

const moderation = z.object({
  enabled: bool(true),
  'purge-after': z.string().catch('30d'),
})

const guard = z.object({
  enabled: bool(true),
  ratelimit: int(2),
  'require-author': bool(false),
  'require-email': bool(false),
  'reply-to-self': bool(false),
})

// Resolved SMTP credentials (the Email Notifications action resolves the SDK smtp
// selection — disabled/system/custom — into these). Isso ignores [smtp] unless
// `notify = smtp`.
const smtp = z.object({
  username: z.string().catch(''),
  password: z.string().catch(''),
  host: z.string().catch('localhost'),
  port: int(587),
  // SDK security is 'tls' | 'starttls'; the action maps implicit-TLS to Isso's
  // 'ssl'. Isso also accepts 'none', but the package never selects it.
  security: z.enum(['starttls', 'ssl']).catch('starttls'),
  to: z.string().catch(''),
  from: z.string().catch(''),
})

// A missing section falls back to its own field-level defaults via parse({}), so
// every default is declared exactly once — on the field.
const shape = z.object({
  general: general.catch(() => general.parse({})),
  admin: admin.catch(() => admin.parse({})),
  moderation: moderation.catch(() => moderation.parse({})),
  guard: guard.catch(() => guard.parse({})),
  smtp: smtp.catch(() => smtp.parse({})),
})

// Hand-added options we don't model, kept verbatim and re-emitted on write
// (section -> key -> value): extra keys inside a modeled section, plus entire
// unmodeled sections.
type Extras = Record<string, Record<string, string | string[]>>

export type IssoCfg = z.infer<typeof shape> & { extras: Extras }

// The keys we model, per section — derived from the schemas (can't drift) so we
// can tell our keys apart from hand-added ones.
const modeledKeys: Record<string, Set<string>> = {
  general: new Set(Object.keys(general.shape)),
  admin: new Set(Object.keys(admin.shape)),
  moderation: new Set(Object.keys(moderation.shape)),
  guard: new Set(Object.keys(guard.shape)),
  smtp: new Set(Object.keys(smtp.shape)),
}

// Pull the hand-added keys/sections out of a freshly parsed file.
function collectExtras(raw: unknown): Extras {
  const extras: Extras = {}
  if (!raw || typeof raw !== 'object') return extras
  for (const [section, kv] of Object.entries(raw as Record<string, unknown>)) {
    if (
      section === 'extras' ||
      !kv ||
      typeof kv !== 'object' ||
      Array.isArray(kv)
    )
      continue
    const known = modeledKeys[section]
    for (const [key, val] of Object.entries(kv as Record<string, unknown>)) {
      if (
        (known && known.has(key)) ||
        (typeof val !== 'string' && !Array.isArray(val))
      )
        continue
      if (!extras[section]) extras[section] = {}
      extras[section][key] = val
    }
  }
  return extras
}

// On a fresh read the extras sit in the parsed sections; on merge's re-validate
// of its own output they arrive pre-collected under `extras` — pass those through
// rather than re-scanning (the sections have already been stripped by then).
function validate(raw: unknown): IssoCfg {
  const carried = (raw as { extras?: unknown } | null)?.extras
  const extras =
    carried && typeof carried === 'object' && !Array.isArray(carried)
      ? (carried as Extras)
      : collectExtras(raw)
  return { ...shape.parse(raw), extras }
}

// Strip CR/LF from interpolated values so one setting can't inject extra INI
// keys/sections (e.g. a password or host containing a newline).
const v = (s: string) => String(s).replace(/[\r\n]+/g, ' ')

// Render a hand-added option: arrays become Isso continuation lists, like host.
function renderExtra(key: string, val: string | string[]): string[] {
  return Array.isArray(val)
    ? [`${v(key)} =`, ...val.map((item) => `    ${v(item)}`)]
    : [`${v(key)} = ${v(val)}`]
}

function extraLines(extras: Extras, section: string): string[] {
  const kv = extras[section]
  return kv ? Object.entries(kv).flatMap(([k, val]) => renderExtra(k, val)) : []
}

function serialize(o: IssoCfg): string {
  const hostBlock = o.general.host.length
    ? '\n' + o.general.host.map((h) => `    ${v(h)}`).join('\n')
    : ''
  const lines = [
    '# Managed by StartOS. Edit settings via the Isso service actions.',
    '',
    '[general]',
    `dbpath = ${v(o.general.dbpath)}`,
    `host =${hostBlock}`,
    `max-age = ${v(o.general['max-age'])}`,
    `notify = ${v(o.general.notify)}`,
    `reply-notifications = ${o.general['reply-notifications']}`,
    `gravatar = ${o.general.gravatar}`,
    `latest-enabled = ${o.general['latest-enabled']}`,
    ...extraLines(o.extras, 'general'),
    '',
    '[admin]',
    `enabled = ${o.admin.enabled}`,
    `password = ${v(o.admin.password)}`,
    ...extraLines(o.extras, 'admin'),
    '',
    '[moderation]',
    `enabled = ${o.moderation.enabled}`,
    `purge-after = ${v(o.moderation['purge-after'])}`,
    ...extraLines(o.extras, 'moderation'),
    '',
    '[guard]',
    `enabled = ${o.guard.enabled}`,
    `ratelimit = ${o.guard.ratelimit}`,
    `require-author = ${o.guard['require-author']}`,
    `require-email = ${o.guard['require-email']}`,
    `reply-to-self = ${o.guard['reply-to-self']}`,
    ...extraLines(o.extras, 'guard'),
    '',
    '[smtp]',
    `username = ${v(o.smtp.username)}`,
    `password = ${v(o.smtp.password)}`,
    `host = ${v(o.smtp.host)}`,
    `port = ${o.smtp.port}`,
    `security = ${v(o.smtp.security)}`,
    `to = ${v(o.smtp.to)}`,
    `from = ${v(o.smtp.from)}`,
    ...extraLines(o.extras, 'smtp'),
  ]
  // Entire sections the user added that we don't model (e.g. [hash], [markup]).
  for (const [section, kv] of Object.entries(o.extras)) {
    if (modeledKeys[section] || !kv || typeof kv !== 'object') continue
    lines.push(
      '',
      `[${section}]`,
      ...Object.entries(kv).flatMap(([k, val]) => renderExtra(k, val)),
    )
  }
  return lines.join('\n') + '\n'
}

// Parse configparser: `[section]` headers, `key = value` lines, and
// newline-indented continuation lines (collected into an array — `host`). Option
// keys are lowercased to match configparser, so a hand edit like `Gravatar` lands
// on the modeled `gravatar` instead of duplicating it.
function deserialize(str: string): unknown {
  const out: Record<string, Record<string, string | string[]>> = {}
  if (typeof str !== 'string' || !str) return out
  let section: Record<string, string | string[]> | null = null
  let key: string | null = null

  for (const raw of str.split('\n')) {
    const line = raw.replace(/\r$/, '')
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue

    const header = trimmed.match(/^\[(.+)\]$/)
    if (header) {
      section = out[header[1]] = {}
      key = null
      continue
    }
    if (!section) continue

    // Continuation: indented, no `key =`, appended to the previous key.
    if (/^\s/.test(line) && key && !/^[^=]+=/.test(trimmed)) {
      const prev = section[key]
      const arr = Array.isArray(prev) ? prev : prev ? [prev] : []
      arr.push(trimmed)
      section[key] = arr
      continue
    }

    const kv = trimmed.match(/^([^=]+?)\s*=\s*(.*)$/)
    if (kv) {
      key = kv[1].trim().toLowerCase()
      section[key] = kv[2]
    }
  }
  return out
}

export const issoCfg = FileHelper.raw(
  { base: sdk.volumes.main, subpath: `${configSubpath}/isso.cfg` },
  (obj: IssoCfg) => serialize(obj),
  (str) => deserialize(str),
  (obj) => validate(obj),
)
