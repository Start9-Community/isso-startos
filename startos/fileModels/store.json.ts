import { z, FileHelper, smtpShape } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// isso.cfg (the issoCfg File Model) is the source of truth for all Isso
// settings. This store keeps ONE thing the config file can't represent: the SDK
// SMTP *selection* (disabled / use the server's system SMTP / custom), so the
// Email Notifications form can prefill it. That action resolves the selection
// and writes the concrete credentials into isso.cfg [smtp].
const storeConfigSchema = z.object({
  smtp: smtpShape.catch({ selection: 'disabled', value: {} }),
})

export type StoreConfig = z.infer<typeof storeConfigSchema>

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'start9/store.json' },
  storeConfigSchema,
)
