import { sdk } from '../sdk'
import { configure } from './configure'
import { adminLogin } from './adminLogin'
import { embedCode } from './embedCode'

export const actions = sdk.Actions.of()
  .addAction(configure)
  .addAction(embedCode)
  .addAction(adminLogin)
