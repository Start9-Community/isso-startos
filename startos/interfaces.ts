import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const host = sdk.MultiHost.of(effects, 'main')
  const origin = await host.bindPort(uiPort, { protocol: 'http' })

  // The comment server / embed endpoint — the address that goes in the embed
  // snippet. Its root is Isso's API (GET / => "missing uri query"), not a
  // human-browsable page, so it is an `api` interface, not a `ui` one.
  const comments = sdk.createInterface(effects, {
    name: i18n('Isso Server'),
    id: 'comments',
    description: i18n(
      'The Isso commenting server — embed comments from this address.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  // A deep-link to the /admin moderation panel — the only human-browsable page.
  // Same port as `ui` (Isso serves everything on one server), so this is for
  // discoverability, not network isolation.
  const admin = sdk.createInterface(effects, {
    name: i18n('Moderation Panel'),
    id: 'admin',
    description: i18n(
      'The Isso moderation panel. Log in with the Set Admin Password credential.',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '/admin/',
    query: {},
  })

  const receipt = await origin.export([comments, admin])

  return [receipt]
})
