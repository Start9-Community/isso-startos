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
  charset: 'a-z,A-Z,0-9',
  len: 24,
}
