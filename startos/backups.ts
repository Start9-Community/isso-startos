import { sdk } from './sdk'

// The `main` volume holds the SQLite comments DB, the rendered isso.cfg, and
// package state (store.json). SQLite is single-file and Isso is stopped before
// a backup, so a plain volume backup is consistent.
export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) => sdk.Backups.ofVolumes('main'),
)
