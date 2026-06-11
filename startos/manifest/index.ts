import { setupManifest } from '@start9labs/start-sdk'
import { longDescription, shortDescription } from './i18n'

// Official upstream image, published for x86_64 and aarch64. Pinned by digest.
// 0.14.0 == the `release` tag at time of packaging.
const ISSO_IMAGE =
  'ghcr.io/isso-comments/isso:0.14.0@sha256:8e813ff52004f39c2c08237994450d3760515c4c6fa32faf61431bb280578e4e'

export const manifest = setupManifest({
  id: 'isso',
  title: 'Isso',
  license: 'MIT',
  packageRepo: 'https://github.com/kwsantiago/isso-startos',
  upstreamRepo: 'https://github.com/isso-comments/isso',
  marketingUrl: 'https://isso-comments.de/',
  donationUrl: null,
  docsUrls: ['https://isso-comments.de/docs/'],
  description: {
    short: shortDescription,
    long: longDescription,
  },
  volumes: ['main'],
  images: {
    isso: {
      source: { dockerTag: ISSO_IMAGE },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
