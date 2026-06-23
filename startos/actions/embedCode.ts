import { sdk } from '../sdk'
import { i18n } from '../i18n'

const { InputSpec, Value } = sdk

// Build the HTML snippet for a chosen server address. The address is selected
// from the comment server's externally-usable addresses: `.nonLocal` drops
// loopback/link-local, and excluding `mdns` drops `.local` (useless for
// embedding). https is forced so the script isn't mixed-content-blocked.
const inputSpec = InputSpec.of({
  address: Value.dynamicSelect(async ({ effects }) => {
    const urls = await sdk.serviceInterface
      .getOwn(
        effects,
        'comments',
        (i) =>
          i?.addressInfo?.nonLocal
            .filter({ exclude: { kind: 'mdns' } })
            .format() ?? [],
      )
      .const()
    const addresses = [
      ...new Set(
        urls.map((u) => u.replace(/^http:\/\//, 'https://').replace(/\/$/, '')),
      ),
    ]
    return {
      name: i18n('Server Address'),
      description: i18n(
        'Choose the address your visitors will load comments from. For a public site, use a public domain (see the Instructions tab).',
      ),
      values: addresses.reduce(
        (o, u) => ({ ...o, [u]: u }),
        {} as Record<string, string>,
      ),
      default: addresses[0] ?? '',
    }
  }),
})

export const embedCode = sdk.Action.withInput(
  'embed-code',

  async ({ effects }) => ({
    name: i18n('Embed Code'),
    description: i18n('Get the HTML snippet to add comments to your website'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({}),

  async ({ effects, input }) => {
    const base = input.address.replace(/\/$/, '')
    const snippet =
      `<script\n` +
      `  data-isso="${base}/"\n` +
      `  src="${base}/js/embed.min.js"\n` +
      `></script>\n` +
      `<section id="isso-thread"></section>`

    return {
      version: '1' as const,
      title: 'Embed Code',
      message:
        "Paste this snippet into any page where comments should appear. That page's origin must be listed under Configure → Websites.",
      result: {
        type: 'single' as const,
        name: 'HTML Snippet',
        description: null,
        value: snippet,
        copyable: true,
        masked: false,
        qr: false,
      },
    }
  },
)
