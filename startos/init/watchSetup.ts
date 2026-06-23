import { setAdminPassword } from '../actions/setAdminPassword'
import { issoCfg } from '../fileModels/issoCfg'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Surface the one required onboarding step — setting the admin password — as a
// critical task while it's unset, so the panel is never served unauthenticated.
// Read with `.once()`, NOT `.const`: main.ts already holds a reactive `.const`
// read of isso.cfg, so a second subscription here would fire a competing restart
// on every settings change and wedge the daemon in the stopped state.
// createOwnTask is idempotent, and running the action dismisses its task.
//
// Websites are NOT gated this way: the file model seeds a localhost placeholder
// so Isso always has a non-empty CORS allowlist and starts without any user
// input — the user can add real origins via the Websites action whenever.
export const watchSetup = sdk.setupOnInit(async (effects) => {
  const cfg = await issoCfg.read().once()

  if (!cfg?.admin.password) {
    await sdk.action.createOwnTask(effects, setAdminPassword, 'critical', {
      reason: i18n('Create the admin password for the moderation panel'),
    })
  }
})
