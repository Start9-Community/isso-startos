import { sdk } from '../sdk'
import { configureServer } from './configure/server'
import { configureSmtp } from './configure/smtp'
import { setWebsites } from './configure/websites'
import { embedCode } from './embedCode'
import { setAdminPassword } from './setAdminPassword'

export const actions = sdk.Actions.of()
  .addAction(setWebsites)
  .addAction(configureServer)
  .addAction(configureSmtp)
  .addAction(setAdminPassword)
  .addAction(embedCode)
