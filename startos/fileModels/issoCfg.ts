import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { configSubpath } from '../utils'

// The rendered Isso config. It is generated from store.json on every start
// (see main.ts), so this helper is write-only as far as the package is
// concerned; users change settings through the Configure action, not this file.
export const issoCfg = FileHelper.string({
  base: sdk.volumes.main,
  subpath: `${configSubpath}/isso.cfg`,
})
