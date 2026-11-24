import { issoCfg } from '../fileModels/issoCfg'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'
import { resolveIssoSmtp } from '../utils'

// Keeps isso.cfg [smtp] in step with the server's SMTP while "system" is selected.
export const watchSystemSmtp = sdk.setupOnInit(async (effects) => {
  const selection = await storeJson.read((s) => s.smtp).const(effects)
  if (selection?.selection !== 'system') return

  await issoCfg.update(effects, async (cfg) => {
    // Custom and disabled selections remain exclusively action-owned.
    const currentSelection = await storeJson.read((s) => s.smtp).once()
    if (!cfg || currentSelection?.selection !== 'system') return null

    const { notify, smtp } = await resolveIssoSmtp(effects, currentSelection)
    return {
      ...cfg,
      general: { ...cfg.general, notify },
      smtp: { ...cfg.smtp, ...smtp },
    }
  })
})
