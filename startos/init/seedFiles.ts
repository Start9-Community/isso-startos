import { issoCfg } from '../fileModels/issoCfg'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const seedFiles = sdk.setupOnInit(async (effects) => {
  // Seed defaults on every init so new schema defaults apply on upgrade, and so
  // both files exist before main.ts and the daemon read them.
  await issoCfg.merge(effects, {})
  await storeJson.merge(effects, {})
})
