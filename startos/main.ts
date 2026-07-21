import { i18n } from './i18n'
import { sdk } from './sdk'
import { issoCfg } from './fileModels/issoCfg'
import {
  configDir,
  configSubpath,
  dbDir,
  dbSubpath,
  issoCfgPath,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Isso!'))

  // isso.cfg is seeded by seedFiles at init and read by the daemon via
  // ISSO_SETTINGS. Restart whenever it changes (the actions write it; the user
  // may edit it directly over SSH).
  const cfg = await issoCfg.read().const(effects)
  if (!cfg) throw new Error('isso.cfg has not been seeded')

  const sub = sdk.SubContainer.of(
    effects,
    { imageId: 'isso' },
    sdk.Mounts.of()
      .mountVolume({
        volumeId: 'main',
        subpath: dbSubpath,
        mountpoint: dbDir,
        readonly: false,
      })
      .mountVolume({
        volumeId: 'main',
        subpath: configSubpath,
        mountpoint: configDir,
        readonly: true,
      }),
    'isso-sub',
  )

  return sdk.Daemons.of(effects).addDaemon('primary', {
    subcontainer: sub,
    exec: {
      command: sdk.useEntrypoint(),
      env: { ISSO_SETTINGS: issoCfgPath },
    },
    ready: {
      display: i18n('Isso Server'),
      fn: () =>
        sdk.healthCheck.checkWebUrl(
          effects,
          `http://localhost:${uiPort}/info`,
          {
            successMessage: i18n('The Isso server is ready'),
            errorMessage: i18n('The Isso server is starting'),
          },
        ),
    },
    requires: [],
  })
})
