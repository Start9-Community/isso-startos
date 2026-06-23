import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { configSubpath, dbPath } from '../utils'

// isso.cfg is Python configparser (INI with newline-indented continuation lists
// for `host`). The SDK's FileHelper.ini (the `ini` npm package) can't round-trip
// that — it quotes newline values and writes arrays as `key[]=`, both of which
// Isso's parser reads wrong. So we model it with FileHelper.raw plus a small
// configparser serializer/parser, the way lnd-startos handles lnd.conf.

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

const shape = z.object({
  general: z
    .object({
      dbpath: z.string().catch(dbPath),
      // Isso's CORS allowlist: the website origins allowed to embed comments.
      // We write it as a continuation list (parsed to an array); a hand-edited
      // single-line `host = x` parses to a string, so coerce that to [x].
      host: z
        .union([
          z.array(z.string()),
          z.string().transform((s) => (s.trim() ? [s.trim()] : [])),
        ])
        .catch([]),
      'max-age': z.string().catch('15m'),
      notify: z.string().catch('stdout'),
      'reply-notifications': bool(false),
      gravatar: bool(false),
      'latest-enabled': bool(false),
    })
    .catch({
      dbpath: dbPath,
      host: [],
      'max-age': '15m',
      notify: 'stdout',
      'reply-notifications': false,
      gravatar: false,
      'latest-enabled': false,
    }),
  admin: z
    .object({
      // Only meaningful once a password exists (gated by the Set Admin Password
      // action so /admin is never served with an empty password).
      enabled: bool(false),
      password: z.string().catch(''),
    })
    .catch({ enabled: false, password: '' }),
  moderation: z
    .object({
      enabled: bool(true),
      'purge-after': z.string().catch('30d'),
    })
    .catch({ enabled: true, 'purge-after': '30d' }),
  guard: z
    .object({
      enabled: bool(true),
      ratelimit: int(2),
      'require-author': bool(false),
      'require-email': bool(false),
      'reply-to-self': bool(false),
    })
    .catch({
      enabled: true,
      ratelimit: 2,
      'require-author': false,
      'require-email': false,
      'reply-to-self': false,
    }),
  // Resolved SMTP credentials (the Email Notifications action resolves the SDK
  // smtp selection — disabled/system/custom — into these). Isso ignores [smtp]
  // unless `notify = smtp`.
  smtp: z
    .object({
      username: z.string().catch(''),
      password: z.string().catch(''),
      host: z.string().catch('localhost'),
      port: int(587),
      security: z.string().catch('starttls'),
      to: z.string().catch(''),
      from: z.string().catch(''),
    })
    .catch({
      username: '',
      password: '',
      host: 'localhost',
      port: 587,
      security: 'starttls',
      to: '',
      from: '',
    }),
})

export type IssoCfg = z.infer<typeof shape>

// Strip CR/LF from interpolated values so one setting can't inject extra INI
// keys/sections (e.g. a password or host containing a newline).
const v = (s: string) => String(s).replace(/[\r\n]+/g, ' ')

function serialize(o: IssoCfg): string {
  const hostBlock = o.general.host.length
    ? '\n' + o.general.host.map((h) => `    ${v(h)}`).join('\n')
    : ''
  return (
    [
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
      '',
      '[admin]',
      `enabled = ${o.admin.enabled}`,
      `password = ${v(o.admin.password)}`,
      '',
      '[moderation]',
      `enabled = ${o.moderation.enabled}`,
      `purge-after = ${v(o.moderation['purge-after'])}`,
      '',
      '[guard]',
      `enabled = ${o.guard.enabled}`,
      `ratelimit = ${o.guard.ratelimit}`,
      `require-author = ${o.guard['require-author']}`,
      `require-email = ${o.guard['require-email']}`,
      `reply-to-self = ${o.guard['reply-to-self']}`,
      '',
      '[smtp]',
      `username = ${v(o.smtp.username)}`,
      `password = ${v(o.smtp.password)}`,
      `host = ${v(o.smtp.host)}`,
      `port = ${o.smtp.port}`,
      `security = ${v(o.smtp.security)}`,
      `to = ${v(o.smtp.to)}`,
      `from = ${v(o.smtp.from)}`,
    ].join('\n') + '\n'
  )
}

// Parse configparser: `[section]` headers, `key = value` lines, and
// newline-indented continuation lines (collected into an array — `host`).
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
      key = kv[1].trim()
      section[key] = kv[2]
    }
  }
  return out
}

export const issoCfg = FileHelper.raw(
  { base: sdk.volumes.main, subpath: `${configSubpath}/isso.cfg` },
  (obj: IssoCfg) => serialize(obj),
  (str) => deserialize(str),
  (obj) => shape.parse(obj),
)
