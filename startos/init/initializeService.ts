import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { configure } from '../actions/configure'
import { randomPassword } from '../utils'

export const initializeService = sdk.setupOnInit(async (effects, kind) => {
  // Seed defaults on every init so new schema defaults apply on upgrade.
  await storeJson.merge(effects, {})

  if (kind !== 'install') return

  // Generate the /admin moderation password once at install.
  await storeJson.merge(effects, {
    adminPassword: utils.getDefaultString(randomPassword),
  })

  // Isso is non-functional until at least one embedding website is whitelisted.
  await sdk.action.createOwnTask(effects, configure, 'critical', {
    reason: 'Set the website(s) that will embed Isso comments',
  })
})
