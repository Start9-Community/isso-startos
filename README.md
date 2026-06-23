<p align="center">
  <img src="icon.svg" alt="Isso Logo" width="21%">
</p>

# Isso on StartOS

> **Upstream docs:** <https://isso-comments.de/docs/>
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
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
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
| `isso` | Commenting server (gunicorn WSGI) | `ghcr.io/isso-comments/isso` |

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
| `config/` | `/config` (read-only) | `isso.cfg` — the typed config File Model (source of truth) |
| `start9/store.json` | (package-internal) | The SDK SMTP selection only (for form prefill) |

---

## Installation and First-Run Flow

The daemon does not start until two **critical tasks** are completed (StartOS
surfaces them in place of the normal controls):

1. **Websites** (under **Configure**) — add the origin(s) that will embed
   comments. This is Isso's CORS allowlist, and Isso requires at least one.
2. **Set Admin Password** — generate the password for the `/admin` moderation
   panel. The password is created here, **not** at install; re-run it any time to
   rotate it.

Once both are done, Isso starts and reads `isso.cfg` directly. Startup is fast;
there is no large first-boot download.

---

## Configuration Management

`isso.cfg` is the source of truth, modeled directly as a typed File Model
(`startos/fileModels/issoCfg.ts`). The service actions read and write it, and
because it is a real File Model, settings you change by hand over SSH are honored
too. Manage settings through the **Configure** group — **Websites** for the
embedding origins, **Server** for moderation / edit window / spam protection, and
**Email Notifications** for SMTP — plus the standalone **Set Admin Password**.

The only value kept outside `isso.cfg` is the SDK SMTP *selection* (`system` /
`custom` / `disabled`) in `store.json`, so the Email Notifications form can
prefill it; that action resolves the selection and writes the concrete `[smtp]`
keys into `isso.cfg`.

Isso's `host` value (its CORS allowlist) is exactly the **Websites** you set.
Enter each as a full `https://` origin — embed pages are served over HTTPS, so an
`http://` entry would be mixed-content-blocked.

---

## Network Access and Interfaces

| Interface ID | Type | Port | Protocol | Purpose |
| --- | --- | --- | --- | --- |
| `comments` | `api` | 8080 | HTTP | The Isso comment server — embed endpoint, `/js/` client, and API. Its root is the fetch API, not a browsable page, so it is an `api` interface. |
| `admin` | `ui` | 8080 | HTTP | The browsable `/admin` moderation panel |

Both interfaces bind the **same** gunicorn port — Isso serves everything from one
process, so `admin` is a convenience link to the moderation UI (the only
human-browsable page; `comments`'s root is the fetch API), **not** a separate
network boundary: wherever `comments` is exposed, `/admin` is reachable too (it is
protected by its own password). Isso is plain HTTP, served over **Tor** and **LAN
/ clearnet**
(StartOS terminates TLS at its reverse proxy). Use the HTTPS address for embedding
so browsers don't block mixed content.

---

## Actions (StartOS UI)

| Action ID | Group | Purpose | Availability |
| --- | --- | --- | --- |
| `set-websites` (Websites) | Configure | Set the origin(s) allowed to embed comments — Isso's CORS allowlist; ≥1 required | any |
| `configure-server` (Server) | Configure | Moderation, edit window, spam protection, and display options | any |
| `configure-smtp` (Email Notifications) | Configure | Email notifications over SMTP (the server's system SMTP or a custom server) + recipient | any |
| `set-admin-password` | — | Generate (or rotate) the `/admin` password and return it (log in via the `admin` interface) | any |
| `embed-code` | — | Pick a server address; returns the HTML embed snippet for it | any |

---

## Embedding Comments

1. Run **Configure → Websites** and add the origin(s) that will show comments,
   including the scheme (e.g. `https://blog.example.com/`).
2. Run **Embed Code**, select the server address to embed from (a public
   Let's Encrypt domain for a public site — see
   [Limitations](#limitations-and-differences)), and copy the snippet it returns:
   ```html
   <script
     data-isso="https://comments.example.com/"
     src="https://comments.example.com/js/embed.min.js"
   ></script>
   <section id="isso-thread"></section>
   ```
3. The page's origin must be one of the **Websites** you whitelisted, otherwise
   the browser's CORS check blocks the comments.
4. Run **Set Admin Password**, then open the **Moderation Panel** interface and
   log in (no username — the password alone).

---

## Backups and Restore

**Included in backup:** the `main` volume — the comments database (`comments.db`),
the config (`isso.cfg`, which holds all settings and the admin password), and
`store.json`.
**Restore:** standard StartOS restore flow (`restoreInit`); the server returns
with all comments and settings intact.

---

## Health Checks

| Check | Method | Notes |
| --- | --- | --- |
| Isso Server | HTTP GET `/info` returns 200 | Isso's unauthenticated server-info endpoint |

---

## Dependencies

None.

---

## Limitations and Differences

1. **Websites must be set** — Isso requires at least one whitelisted website
   origin (via **Configure → Websites**) and will not start without one; this is
   upstream CORS behavior.
2. **Public embedding needs a publicly-trusted certificate** — visitors load
   comments cross-origin from the `comments` interface, so for a public site it
   must be reached via a **Let's Encrypt domain**. A bare IP, `.onion`, or
   `.local` address can only carry the server's Root CA, which arbitrary
   visitors' browsers don't trust — and public CAs do not issue certificates for
   IP addresses. The Root-CA path is only viable for devices that have installed
   the Root CA (personal/private use).
3. **No bundled demo page** — the production gunicorn image does not serve Isso's
   development demo page; comments are viewed on your own embedding pages.
4. **Mixed content** — embed pages served over HTTPS must use the HTTPS Isso
   address; mixing HTTP and HTTPS will be blocked by the browser.
5. **Settings are file-backed** — manage them through the Configure actions;
   `isso.cfg` is a typed File Model, so hand edits over SSH are honored too.

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
image: ghcr.io/isso-comments/isso           # multi-arch, pinned by digest in the manifest
entry: sdk.useEntrypoint()                  # gunicorn, port 8080
volumes:
  main:
    db: /db                                 # comments.db (read-write)
    config: /config                         # isso.cfg — the config File Model (read-only mount)
    store: start9/store.json                # SDK SMTP selection only (form prefill)
interfaces:
  comments:
    type: api                               # comment server / embed endpoint (root is the fetch API)
    port: 8080
    protocol: http                          # Tor + LAN
  admin:
    type: ui                                # browsable /admin moderation panel
    port: 8080                              # same port as comments — /admin deep-link, not isolated
    protocol: http
config_model: isso.cfg (FileHelper.raw File Model; source of truth). store.json holds only the SMTP selection.
cors_hosts: the configured Websites (Isso [general] host)
dependencies: none
health: GET /info == 200
actions:
  - set-websites        # Configure > Websites; CORS allowlist (>= 1 origin)
  - configure-server    # Configure > Server; moderation, edit window, guard
  - configure-smtp      # Configure > Email Notifications; SMTP + recipient
  - set-admin-password  # generate / rotate the /admin password
  - embed-code          # pick an address; returns the embed snippet
notes:
  - comments do not load until at least one Website origin is whitelisted
  - admin panel is enabled only once a password is set; gated by that password
  - the admin interface shares the comments port — discoverability, not network isolation
  - production image serves no demo page
```
