import { utils } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { i18n } from '../i18n'
import { issoCfg } from '../fileModels/issoCfg'
import { randomPassword } from '../utils'

// Generates and stores the /admin moderation password (isso.cfg [admin]
// password). The panel is always enabled, so this password is what authenticates
// it. Surfaced as a critical task at install when no password is set — the
// service stays stopped until one is — and re-running it rotates the password.
// The merge restarts Isso (main holds a `.const` read of isso.cfg). Login is via
// the Moderation Panel interface, so this only returns the credential.
export const setAdminPassword = sdk.Action.withoutInput(
  'set-admin-password',

  async ({ effects }) => ({
    name: i18n('Set Admin Password'),
    description: i18n(
      'Generate a new random password for the Isso moderation panel at /admin. Run this again at any time to reset it.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const adminPassword = utils.getDefaultString(randomPassword)
    await issoCfg.merge(effects, { admin: { password: adminPassword } })

    return {
      version: '1' as const,
      title: 'Admin Password Set',
      message:
        'Open the Moderation Panel interface and log in with the password below. There is no username.',
      result: {
        type: 'single' as const,
        name: 'Admin Password',
        description: null,
        value: adminPassword,
        masked: true,
        copyable: true,
        qr: false,
      },
    }
  },
)
