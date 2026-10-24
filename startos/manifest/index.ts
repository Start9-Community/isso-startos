import { setupManifest } from '@start9labs/start-sdk'
import { longDescription, shortDescription } from './i18n'

// Official upstream image, published for x86_64 and aarch64. Pinned by digest.
// No release is tagged after 0.14.0. `latest` is the master image built
// 2026-09-15 (413d447); the project version inside it is still 0.14.0.
const ISSO_IMAGE =
  'ghcr.io/isso-comments/isso:latest@sha256:2ed86d6110f8116f3d91620c64b1f320a1b85ca7135848aa6b6d861c8c7485f3'

export const manifest = setupManifest({
  id: 'isso',
  title: 'Isso',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9-Community/isso-startos',
  upstreamRepo: 'https://github.com/isso-comments/isso',
  marketingUrl: 'https://isso-comments.de/',
  donationUrl: null,
  description: {
    short: shortDescription,
    long: longDescription,
  },
  volumes: ['main'],
  images: {
    isso: {
      source: { dockerBuild: { buildArgs: { IMAGE: ISSO_IMAGE } } },
      arch: ['x86_64', 'aarch64'],
    },
  },
})
