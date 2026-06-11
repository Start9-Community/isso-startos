<p align="center">
  <img src="icon.svg" alt="Isso Logo" width="18%">
</p>

# Isso on StartOS

> **Upstream project:** <https://isso-comments.de/>
>
> Everything not listed in this document should behave the same as upstream
> Isso. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and applicable.

StartOS package for [Isso](https://isso-comments.de/), a lightweight,
privacy-friendly commenting server written in Python, similar to Disqus. It lets
visitors comment on your blog or website without handing their data to a third
party. Comments are stored in a local SQLite database on your server and embedded
into your pages with a single small JavaScript snippet.

Isso supports Markdown comments, threaded replies, author edit/delete within a
time window, a moderation queue with an admin panel, email/SMTP notifications,
Gravatar avatars, and basic spam protection (per-IP rate limiting).

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Configuration Model](#configuration-model)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Embedding Comments](#embedding-comments)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Building](#building)
- [License](#license)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

The package uses Isso's official prebuilt image, pinned to an immutable digest in
`startos/manifest/index.ts`.

| Image | Role | Source |
| --- | --- | --- |
| `isso` | Commenting server (gunicorn WSGI) | `ghcr.io/isso-comments/isso:0.14.0` |

| Property | Value |
| --- | --- |
| Architectures | x86_64, aarch64 |
| Entry command | Upstream entrypoint (`sdk.useEntrypoint()`), gunicorn on port 8080 |

---

## Volume and Data Layout

The package uses a single volume, `main`, with these subpaths:

| Subpath in `main` volume | Container mount point | Purpose |
| --- | --- | --- |
| `db/` | `/db` (read-write) | SQLite database `comments.db` |
| `config/` | `/config` (read-only) | Generated `isso.cfg` |
| `start9/store.json` | (package-internal) | Typed settings + generated admin password |

---

## Configuration Model

`start9/store.json` is the typed source of truth for all settings. On every
start, `main.ts` renders these into `/config/isso.cfg` and launches Isso against
it, so you never edit the config file by hand — change settings through the
**Configure** action instead.

Isso's `host` value (its CORS allowlist) is built from the **Websites** you set
in Configure, plus this server's own StartOS addresses (so the `/admin` panel,
served by Isso itself, is always allowed). `http://` addresses are upgraded to
`https://` so the embed script is not mixed-content-blocked behind the StartOS
reverse proxy.

---

## Installation and First-Run Flow

1. On install, a strong **admin password** is generated once and stored in
   `start9/store.json`.
2. A **critical task** prompts you to run **Configure** and set your
   **Websites** — Isso will not load comments until at least one website origin
   is whitelisted (this is Isso's CORS protection, by design).
3. On start, `isso.cfg` is rendered from `store.json` and the server comes up
   within seconds. Startup is fast; there is no large first-boot download.

---

## Network Access and Interfaces

| Interface ID | Port | Protocol | Purpose |
| --- | --- | --- | --- |
| `ui` | 8080 | HTTP | The Isso server: embed endpoint, `/js/` client, and `/admin` panel |

Isso is plain HTTP, so the interface is served over both **Tor** and **LAN /
clearnet** (StartOS terminates TLS at its reverse proxy). Use the HTTPS address
for embedding so browsers don't block mixed content.

---

## Actions (StartOS UI)

| Action ID | Purpose | Availability |
| --- | --- | --- |
| `configure` | Set websites, moderation, edit window, spam guard, and SMTP. Saving restarts the server. | any |
| `embed-code` | Show the HTML snippet to paste into your site, plus the server address(es) | any |
| `admin-login` | Show the moderation panel URL (`/admin`) and the admin password | any |

---

## Embedding Comments

1. Run **Configure** and set **Websites** to the origin(s) that will show
   comments, one per line, including the scheme (e.g. `https://blog.example.com/`).
2. Run **Embed Code** and copy the snippet into any page where comments should
   appear:
   ```html
   <script data-isso="https://<your-isso-address>/"
           src="https://<your-isso-address>/js/embed.min.js"></script>
   <section id="isso-thread"></section>
   ```
3. The page's origin must be one of the whitelisted **Websites**, otherwise the
   browser's CORS check blocks the comments.
4. Run **Admin Login** to moderate comments at `/admin` (no username — log in
   with the password alone).

---

## Backups and Restore

**Included in backup:** the `main` volume — the comments database, the generated
config, and the admin password (`store.json`).
**Restore:** standard StartOS restore flow (`restoreInit`); the server returns
with all comments and settings intact.

---

## Health Checks

| Check | Method | Notes |
| --- | --- | --- |
| `ui` | HTTP GET `/info` returns 200 | Isso's unauthenticated server-info endpoint |

---

## Dependencies

None.

---

## Limitations and Differences

1. **Websites must be set** — Isso loads no comments until at least one website
   origin is whitelisted via Configure (upstream CORS behavior).
2. **No bundled demo page** — the production gunicorn image does not serve Isso's
   development demo page; comments are viewed on your own embedding pages.
3. **Mixed content** — embed pages served over HTTPS must use the HTTPS Isso
   address; mixing HTTP and HTTPS will be blocked by the browser.
4. **Settings are managed by the package** — edit settings through the Configure
   action; `isso.cfg` is regenerated on every start.

---

## What Is Unchanged from Upstream

- The Isso server runtime, SQLite storage, JS client, and admin panel.
- All comment behavior: Markdown, threading, edit/delete windows, moderation.
- Disqus/WordPress import tooling shipped in the image.

---

## Building

Requires the [StartOS SDK](https://docs.start9.com/) (`start-cli`), Node.js, and
Docker.

```console
make x86      # build isso_x86_64.s9pk
make arm      # build isso_aarch64.s9pk
make install  # install the freshly built s9pk to a configured server
```

> Building `x86` and `arm` back-to-back on the same machine can fail on the
> second arch (both resolve to the same pinned image digest in the local store);
> CI builds each architecture on a separate runner.

---

## License

The StartOS packaging code in this repository is **MIT** (see [LICENSE](LICENSE)).
The software it installs and runs, **Isso**, is also **MIT** — see
<https://github.com/isso-comments/isso>.

---

## Quick Reference for AI Consumers

```yaml
package_id: isso
architectures: [x86_64, aarch64]
image: ghcr.io/isso-comments/isso:0.14.0   # pinned by digest
entry: sdk.useEntrypoint()                  # gunicorn, port 8080
volumes:
  main:
    db: /db                                 # comments.db (read-write)
    config: /config                         # isso.cfg, generated each start (read-only)
    store: start9/store.json                # typed settings + admin password
interfaces:
  ui:
    port: 8080
    protocol: http                          # Tor + LAN
config_model: store.json -> rendered into isso.cfg on every start
cors_hosts: configured Websites + own StartOS addresses (https-forced)
dependencies: none
health: GET /info == 200
actions:
  - configure       # websites, moderation, guard, smtp
  - embed-code      # HTML snippet + server address
  - admin-login     # /admin URL + generated password
notes:
  - comments do not load until at least one Website origin is whitelisted
  - production image serves no demo page
```
