import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import { StoreConfig } from './fileModels/store.json'

// The upstream image's gunicorn entrypoint binds 0.0.0.0:8080.
export const uiPort = 8080

// Mount points inside the container (the image declares VOLUME /db /config).
export const dbDir = '/db'
export const configDir = '/config'
export const dbPath = `${dbDir}/comments.db`
export const issoCfgPath = `${configDir}/isso.cfg`

// Volume subpaths on the host volume.
export const dbSubpath = 'db'
export const configSubpath = 'config'

export const randomPassword = {
  charset: 'a-z,A-Z,1-9',
  len: 24,
}

// Split a user-entered list of websites (newline- or comma-separated) into a
// clean array of origins, dropping blanks.
export function parseWebsites(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

// The addresses StartOS exposes this Isso server on (Tor + LAN). StartOS
// terminates TLS at its reverse proxy, so force https:// to avoid the embed
// script (loaded over https) being mixed-content-blocked.
export async function ownUiUrls(effects: T.Effects): Promise<string[]> {
  const addressInfo = await sdk.serviceInterface
    .getOwn(effects, 'ui', (i) => i?.addressInfo ?? null)
    .once()
  if (!addressInfo) return []
  const toHttps = (u: string) => u.replace(/^http:\/\//, 'https://')
  return addressInfo.nonLocal
    .format('hostname-info')
    .map((h) => toHttps(addressInfo.nonLocal.toUrl(h)))
}

// Render an isso.cfg from typed settings. Isso's parser is configparser-based:
// `host` is a newline-indented list (getiter splits on '\n'), interpolation is
// disabled so '%' in passwords is safe, and "15m"-style human timedeltas are
// accepted for time values.
export function renderIssoCfg(store: StoreConfig, hosts: string[]): string {
  const hostBlock =
    hosts.length > 0
      ? '\n' + hosts.map((h) => `    ${h}`).join('\n')
      : ''

  const lines: string[] = [
    '# Managed by StartOS. Edit settings via the Isso service actions.',
    '',
    '[general]',
    `dbpath = ${dbPath}`,
    `host =${hostBlock}`,
    `max-age = ${store.maxAge}`,
    `notify = ${store.smtp.enabled ? 'smtp' : 'stdout'}`,
    `reply-notifications = ${store.replyNotifications}`,
    `gravatar = ${store.gravatar}`,
    `latest-enabled = ${store.latestEnabled}`,
    '',
    '[admin]',
    `enabled = ${store.adminEnabled}`,
    `password = ${store.adminPassword}`,
    '',
    '[moderation]',
    `enabled = ${store.moderationEnabled}`,
    `purge-after = ${store.purgeAfter}`,
    '',
    '[guard]',
    `enabled = ${store.guard.enabled}`,
    `ratelimit = ${store.guard.ratelimit}`,
    `require-author = ${store.guard.requireAuthor}`,
    `require-email = ${store.guard.requireEmail}`,
    `reply-to-self = ${store.guard.replyToSelf}`,
  ]

  if (store.smtp.enabled) {
    lines.push(
      '',
      '[smtp]',
      `username = ${store.smtp.username}`,
      `password = ${store.smtp.password}`,
      `host = ${store.smtp.host}`,
      `port = ${store.smtp.port}`,
      `security = ${store.smtp.security}`,
      `to = ${store.smtp.to}`,
      `from = ${store.smtp.from}`,
    )
  }

  return lines.join('\n') + '\n'
}
