# Updating the upstream version

This package runs Isso's official prebuilt image, [`ghcr.io/isso-comments/isso`](https://github.com/isso-comments/isso/pkgs/container/isso), published by the upstream [isso-comments/isso](https://github.com/isso-comments/isso) project. "Upstream" here means that project. The image is pinned by **both tag and digest** in `startos/manifest/index.ts` (the `ISSO_IMAGE` constant).

## Determining the upstream version

Fetch the latest upstream release tag:

```sh
gh release view -R isso-comments/isso --json tagName -q .tagName
```

The current pin is the version after the `:` in `ghcr.io/isso-comments/isso:<version>@sha256:<digest>` in `startos/manifest/index.ts`.

## Applying the bump

1. Resolve the **multi-arch manifest-list digest** for the new tag (do not pin a single-arch digest — the manifest declares both `x86_64` and `aarch64`, and StartOS selects the right architecture at install from the manifest list):

   ```sh
   docker buildx imagetools inspect ghcr.io/isso-comments/isso:<new version> \
     --format '{{json .Manifest.Digest}}'
   ```

   Confirm it lists both `linux/amd64` and `linux/arm64`:

   ```sh
   docker buildx imagetools inspect ghcr.io/isso-comments/isso:<new version>
   ```

2. Update `ISSO_IMAGE` in `startos/manifest/index.ts` to `ghcr.io/isso-comments/isso:<new version>@sha256:<digest>`.

3. Bump `version` in `startos/versions/current.ts` to `<new version>:0` and rewrite its release notes. Spin off a new version file only if the bump needs a migration — see the [Versions](https://docs.start9.com/packaging) guide.

4. Before releasing, re-check the rendered config against any new or renamed keys in Isso's bundled `isso.cfg` (sections `[general]`, `[admin]`, `[moderation]`, `[guard]`, `[smtp]`). `startos/utils.ts` `renderIssoCfg` writes these keys explicitly; a renamed upstream key is silently ignored by Isso, so a setting could stop taking effect without an error.
