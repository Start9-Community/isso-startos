import { issoCfg } from '../fileModels/issoCfg'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { resolveIssoSmtp } from '../utils'

// Keeps isso.cfg [smtp] in step with the server's SMTP while "system" is selected.
export const watchSystemSmtp = sdk.setupOnInit(async (effects) => {
  const selection = await storeJson.read((s) => s.smtp).const(effects)
  if (selection?.selection !== 'system') return

  const { notify, smtp } = await resolveIssoSmtp(effects, selection)
  await issoCfg.merge(effects, { general: { notify }, smtp })
})
