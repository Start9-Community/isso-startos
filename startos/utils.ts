import { T } from '@start9labs/start-sdk'
import type { StoreConfig } from './fileModels/store.json'
import { sdk } from './sdk'

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

// Isso refuses to start with an empty CORS allowlist (its [general] host), so we
// seed this placeholder origin at install and the Websites action always keeps it
// appended (and hidden from the form). Lets the service boot before the user has
// whitelisted any real website.
export const defaultHost = 'localhost'

export const randomPassword = {
  charset: 'a-z,A-Z,0-9',
  len: 24,
}

// The isso.cfg values for an SMTP selection, minus the recipient (`to`), which the
// action owns. `.const` re-runs a reactive init handler when the server's SMTP changes.
export async function resolveIssoSmtp(
  effects: T.Effects,
  selection: StoreConfig['smtp'],
) {
  let resolved: T.SmtpValue | null = null
  if (selection.selection === 'system') {
    resolved = await sdk.getSystemSmtp(effects).const()
    if (resolved && selection.value.customFrom) {
      resolved = { ...resolved, from: selection.value.customFrom }
    }
  } else if (selection.selection === 'custom') {
    const p = selection.value.provider.value
    resolved = {
      host: p.host,
      from: p.from,
      username: p.username,
      password: p.password ?? null,
      port: Number(p.security.value.port),
      security: p.security.selection,
    }
  }

  return {
    notify: resolved ? ('smtp' as const) : ('stdout' as const),
    smtp: resolved
      ? {
          username: resolved.username,
          password: resolved.password ?? '',
          host: resolved.host,
          port: resolved.port,
          // SDK security is 'tls' | 'starttls'; Isso's implicit-TLS is 'ssl'.
          security:
            resolved.security === 'tls'
              ? ('ssl' as const)
              : ('starttls' as const),
          from: resolved.from,
        }
      : {
          username: '',
          password: '',
          host: 'localhost',
          port: 587,
          security: 'starttls' as const,
          from: '',
        },
  }
}
