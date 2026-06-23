import { issoCfg } from '../../fileModels/issoCfg'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

const { InputSpec, Value } = sdk

// Isso parses these as human timedeltas (e.g. 15m, 2h, 7d, 1h30m). Reject
// free text up front so a typo cannot wedge the daemon in a restart loop.
const timedeltaPattern = {
  regex: '^\\s*(\\d+\\s*[smhdw]\\s*)+$',
  description: i18n('Use a number and unit, e.g. 15m, 2h, 7d, or 1h30m.'),
}

const guardSpec = InputSpec.of({
  enabled: Value.toggle({
    name: i18n('Enable Spam Protection'),
    description: i18n(
      'Rate-limit comments per IP and apply basic abuse protection. Recommended in production.',
    ),
    default: true,
  }),
  ratelimit: Value.number({
    name: i18n('Rate Limit'),
    description: i18n(
      'Maximum number of new comments allowed per minute per IP.',
    ),
    required: true,
    default: 2,
    min: 1,
    max: 60,
    integer: true,
    units: i18n('per minute'),
  }),
  requireAuthor: Value.toggle({
    name: i18n('Require Name'),
    description: i18n('Force commenters to enter a name (not validated).'),
    default: false,
  }),
  requireEmail: Value.toggle({
    name: i18n('Require Email'),
    description: i18n(
      'Force commenters to enter an email address (not validated).',
    ),
    default: false,
  }),
  replyToSelf: Value.toggle({
    name: i18n('Allow Reply To Self'),
    description: i18n('Let commenters reply to their own comments.'),
    default: false,
  }),
})

const inputSpec = InputSpec.of({
  moderationEnabled: Value.toggle({
    name: i18n('Comment Moderation'),
    description: i18n(
      'Hold new comments in a queue until you approve them in the admin panel. Recommended.',
    ),
    default: true,
  }),
  maxAge: Value.text({
    name: i18n('Edit Window'),
    description: i18n(
      'How long a visitor may edit or delete their own comment after posting, e.g. 15m, 2h, 7d.',
    ),
    required: true,
    default: '15m',
    patterns: [timedeltaPattern],
  }),
  purgeAfter: Value.text({
    name: i18n('Purge Unapproved Comments After'),
    description: i18n(
      'Remove still-unapproved comments from the moderation queue after this period, e.g. 30d.',
    ),
    required: true,
    default: '30d',
    patterns: [timedeltaPattern],
  }),
  gravatar: Value.toggle({
    name: i18n('Gravatar Avatars'),
    description: i18n('Show Gravatar profile images next to comments.'),
    default: false,
  }),
  latestEnabled: Value.toggle({
    name: i18n('Enable /latest Endpoint'),
    description: i18n(
      'Serve the /latest endpoint that returns recent comments across all threads.',
    ),
    default: false,
  }),
  guard: Value.object(
    {
      name: i18n('Spam Protection'),
      description: i18n('Rate limiting and comment requirements.'),
    },
    guardSpec,
  ),
})

export const configureServer = sdk.Action.withInput(
  'configure-server',

  async ({ effects }) => ({
    name: i18n('Server'),
    description: i18n(
      'Moderation, edit window, spam protection, and display options.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: 'Configure',
    visibility: 'enabled',
  }),

  inputSpec,

  // Prefill the form with the current settings.
  async ({ effects }) => {
    const c = await issoCfg.read().once()
    if (!c) return {}
    return {
      moderationEnabled: c.moderation.enabled,
      maxAge: c.general['max-age'],
      purgeAfter: c.moderation['purge-after'],
      gravatar: c.general.gravatar,
      latestEnabled: c.general['latest-enabled'],
      guard: {
        enabled: c.guard.enabled,
        ratelimit: c.guard.ratelimit,
        requireAuthor: c.guard['require-author'],
        requireEmail: c.guard['require-email'],
        replyToSelf: c.guard['reply-to-self'],
      },
    }
  },

  async ({ effects, input }) =>
    issoCfg.merge(effects, {
      general: {
        'max-age': input.maxAge.trim(),
        gravatar: input.gravatar,
        'latest-enabled': input.latestEnabled,
      },
      moderation: {
        enabled: input.moderationEnabled,
        'purge-after': input.purgeAfter.trim(),
      },
      guard: {
        enabled: input.guard.enabled,
        ratelimit: input.guard.ratelimit,
        'require-author': input.guard.requireAuthor,
        'require-email': input.guard.requireEmail,
        'reply-to-self': input.guard.replyToSelf,
      },
    }),
)
