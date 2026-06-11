import { z, FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Typed source of truth for all user-configurable Isso settings. Written by
// init + the Configure action; main.ts renders these into isso.cfg on every
// (re)start. Read with .const() so the daemon restarts when any value changes.
const storeConfigSchema = z.object({
  // Generated once at install; the password for the /admin moderation panel.
  adminPassword: z.string().catch(''),
  // Newline/comma-separated list of website origins allowed to embed comments
  // (Isso's CORS allowlist). Empty until the user runs Configure.
  websites: z.string().catch(''),
  adminEnabled: z.boolean().catch(true),
  moderationEnabled: z.boolean().catch(true),
  // How long a commenter may edit/delete their own comment (human timedelta).
  maxAge: z.string().catch('15m'),
  // How long unapproved comments linger in the moderation queue before purge.
  purgeAfter: z.string().catch('30d'),
  replyNotifications: z.boolean().catch(false),
  gravatar: z.boolean().catch(false),
  latestEnabled: z.boolean().catch(false),
  guard: z
    .object({
      enabled: z.boolean().catch(true),
      ratelimit: z.number().int().catch(2),
      requireAuthor: z.boolean().catch(false),
      requireEmail: z.boolean().catch(false),
      replyToSelf: z.boolean().catch(false),
    })
    .catch({
      enabled: true,
      ratelimit: 2,
      requireAuthor: false,
      requireEmail: false,
      replyToSelf: false,
    }),
  smtp: z
    .object({
      enabled: z.boolean().catch(false),
      username: z.string().catch(''),
      password: z.string().catch(''),
      host: z.string().catch('localhost'),
      port: z.number().int().catch(587),
      security: z.enum(['none', 'starttls', 'ssl']).catch('starttls'),
      to: z.string().catch(''),
      from: z.string().catch(''),
    })
    .catch({
      enabled: false,
      username: '',
      password: '',
      host: 'localhost',
      port: 587,
      security: 'starttls',
      to: '',
      from: '',
    }),
})

export type StoreConfig = z.infer<typeof storeConfigSchema>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'start9/store.json' },
  storeConfigSchema,
)
