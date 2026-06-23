import { issoCfg } from '../../fileModels/issoCfg'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

const { InputSpec, Value, List } = sdk

const inputSpec = InputSpec.of({
  websites: Value.list(
    List.text(
      {
        name: i18n('Websites'),
        description: i18n(
          "The website origin(s) allowed to embed and load comments (Isso's CORS allowlist). At least one is required for comments to work.",
        ),
        default: [],
        // Enforce at least one origin — Isso loads no comments without one.
        minLength: 1,
      },
      {
        placeholder: 'https://blog.example.com/',
        patterns: [
          {
            regex: '^https?://\\S+$',
            description: i18n(
              'Enter a full origin including the scheme, e.g. https://blog.example.com/',
            ),
          },
        ],
      },
    ),
  ),
})

export const setWebsites = sdk.Action.withInput(
  'set-websites',

  async ({ effects }) => ({
    name: i18n('Websites'),
    description: i18n('Choose which website(s) may embed your Isso comments'),
    warning: null,
    allowedStatuses: 'any',
    group: 'Configure',
    visibility: 'enabled',
  }),

  inputSpec,

  // Prefill with the current allowlist (Isso's [general] host).
  async ({ effects }) => {
    const host = await issoCfg.read((c) => c.general.host).once()
    return host?.length ? { websites: host } : {}
  },

  async ({ effects, input }) => {
    // `minLength` guards the UI form; enforce it here too so the rule holds for
    // any caller, and drop blank entries.
    const host = input.websites.map((w) => w.trim()).filter(Boolean)
    if (host.length === 0) {
      throw new Error('Enter at least one website origin.')
    }
    await issoCfg.merge(effects, { general: { host } })
  },
)
