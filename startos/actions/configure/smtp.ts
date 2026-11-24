import { smtpPrefill } from '@start9labs/start-sdk'
import { issoCfg } from '../../fileModels/issoCfg'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { resolveIssoSmtp } from '../../utils'

const { InputSpec, Value } = sdk

// Uses the SDK's standard SMTP input (disabled / the server's system SMTP /
// custom server). Isso also needs a recipient for its moderation emails, which
// the SDK shape doesn't model, so `to` rides alongside.
const inputSpec = InputSpec.of({
  smtp: sdk.inputSpecConstants.smtpInputSpec,
  to: Value.text({
    name: i18n('Notification Recipient'),
    description: i18n(
      'Email address that receives new-comment moderation notifications. Required when email notifications are enabled.',
    ),
    required: false,
    default: null,
    placeholder: 'you@example.com',
  }),
  replyNotifications: Value.toggle({
    name: i18n('Reply Notifications'),
    description: i18n(
      'Let visitors subscribe to email notifications for replies to their own comment. Keep moderation on to avoid spam abuse.',
    ),
    default: false,
  }),
})

export const configureSmtp = sdk.Action.withInput(
  'configure-smtp',

  async ({ effects }) => ({
    name: i18n('Email Notifications'),
    description: i18n(
      'Send new-comment moderation notifications over SMTP, with one-click approve/delete links.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: 'Configure',
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const selection = await storeJson.read((s) => s.smtp).once()
    const cfg = await issoCfg.read().once()
    return {
      smtp: smtpPrefill(selection),
      to: cfg?.smtp.to || undefined,
      replyNotifications: cfg?.general['reply-notifications'],
    }
  },

  async ({ effects, input }) => {
    if (input.smtp.selection !== 'disabled' && !input.to?.trim()) {
      throw new Error(
        'Enter a notification recipient email to enable email notifications.',
      )
    }
    await storeJson.merge(effects, { smtp: input.smtp })

    const { notify, smtp } = await resolveIssoSmtp(effects, input.smtp)
    await issoCfg.merge(effects, {
      general: { notify, 'reply-notifications': input.replyNotifications },
      smtp: { ...smtp, to: notify === 'smtp' ? (input.to?.trim() ?? '') : '' },
    })
  },
)
