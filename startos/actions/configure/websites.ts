import { issoCfg } from '../../fileModels/issoCfg'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { defaultHost } from '../../utils'

const { InputSpec, Value, List } = sdk

const inputSpec = InputSpec.of({
  websites: Value.list(
    List.text(
      {
        name: i18n('Websites'),
        description: i18n(
          "The website origin(s) allowed to embed and load comments (Isso's CORS allowlist). Add the origin of each site where your comments will appear.",
        ),
        default: [],
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

  // Prefill with the current allowlist, minus the localhost placeholder — it's
  // kept internally (re-appended on save), not something the user manages.
  async ({ effects }) => {
    const host = await issoCfg.read((c) => c.general.host).once()
    const websites = (host ?? []).filter((h) => h !== defaultHost)
    return websites.length ? { websites } : {}
  },

  async ({ effects, input }) => {
    // Drop blanks, then always keep the localhost placeholder so Isso never has
    // an empty CORS allowlist (which would stop it from starting).
    const websites = input.websites.map((w) => w.trim()).filter(Boolean)
    const host = [...new Set([...websites, defaultHost])]
    await issoCfg.merge(effects, { general: { host } })
  },
)
