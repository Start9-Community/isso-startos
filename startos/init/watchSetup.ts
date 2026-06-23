import { setWebsites } from '../actions/configure/websites'
import { setAdminPassword } from '../actions/setAdminPassword'
import { issoCfg } from '../fileModels/issoCfg'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Surface the two required onboarding steps as critical tasks while either value
// is unset. Read with `.once()`, NOT `.const`: main.ts already holds a reactive
// `.const` read of isso.cfg, so a second subscription here would fire a competing
// restart on every settings change and wedge the daemon in the stopped state.
// createOwnTask is idempotent, and running the action dismisses its task.
export const watchSetup = sdk.setupOnInit(async (effects) => {
  const cfg = await issoCfg.read().once()

  if (!cfg?.general.host.length) {
    await sdk.action.createOwnTask(effects, setWebsites, 'critical', {
      reason: i18n('Set the website(s) that will embed Isso comments'),
    })
  }

  if (!cfg?.admin.password) {
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n('Create the admin password for the moderation panel'),
    })
  }
})
