<p align="center">
  <img src="icon.png" alt="Isso Logo" width="21%">
</p>

# Isso on StartOS

> Everything not listed in this document should behave the same as upstream
> Isso. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation
> section of `instructions.md` for links.

[Isso](https://github.com/isso-comments/isso) is a self-hosted commenting server: you embed a small script on your website and comments live on your server instead of a third party's. This package runs it, manages its configuration through actions rather than a config file the user edits, and generates the embed snippet with the right address already in it.

- **Upstream repo:** <https://github.com/isso-comments/isso>
- **Wrapper repo:** <https://github.com/Start9-Community/isso-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One upstream image, consumed unmodified and pinned by digest as well as tag.

| Property      | Value                        |
| ------------- | ---------------------------- |
| Image         | `ghcr.io/isso-comments/isso` |
| Architectures | x86_64, aarch64              |

| Subcontainer | Purpose                                  |
| ------------ | ---------------------------------------- |
| `isso-sub`   | The only daemon — the one to `attach` to |

## Volume and Data Layout

One volume, mounted twice — the image declares separate database and configuration volumes, so the package supplies a subpath for each.

| Volume            | Mount Point | Purpose                    |
| ----------------- | ----------- | -------------------------- |
| `main` / `db`     | `/db`       | The comments database      |
| `main` / `config` | `/config`   | The rendered configuration |

The package's own store sits alongside them on the same volume.

The database is a single SQLite file, which is what makes the backup strategy simple — see [Backups and Restore](#backups-and-restore).

## File Models

Two models, and the division is unusual: the application's own config file is the source of truth for nearly everything, and the store holds one thing that file cannot express.

| File         | Format | Modelled                | Written by               |
| ------------ | ------ | ----------------------- | ------------------------ |
| `isso.cfg`   | INI    | Yes — `FileHelper.ini`  | Init and the actions     |
| `store.json` | JSON   | Yes — `FileHelper.json` | Init and the SMTP action |

**`isso.cfg` is where every setting lives**, written by the configuration actions rather than edited by hand. The database path is pinned, and the admin panel is pinned on — everything else is user-owned through the actions: the website allowlist, moderation behavior, spam guarding, the edit window, and the SMTP credentials.

**One placeholder in the allowlist is load-bearing.** Isso refuses to start with an empty allowlist, so the package seeds a local placeholder at install and the Websites action always keeps it appended and hidden from the form. That is what lets the service boot before any real website has been added.

**`store.json` holds one thing: the SMTP _selection_** — disabled, the server's own SMTP, or custom. The config file can only hold concrete credentials, not the fact that they came from the server's settings, so the selection is kept here for the form to pre-fill and the action resolves it into the config file.

Both are seeded on **every** init, so a field added in a later version picks up its default on upgrade.

## Dependencies

None.

## Network Access and Interfaces

**Two interfaces on one port**, because Isso serves everything from one server. The split is for discoverability, not isolation.

| Interface        | Id         | Type | Port | Path      | Description                                    |
| ---------------- | ---------- | ---- | ---- | --------- | ---------------------------------------------- |
| Isso Server      | `comments` | api  | 8080 | —         | The address that goes in the embed snippet     |
| Moderation Panel | `admin`    | ui   | 8080 | `/admin/` | The panel, logged into with the admin password |

**The comments interface is an `api`, not a `ui`, and that is accurate rather than pedantic**: its root is Isso's API and returns an error to a browser, not a page. The only human-browsable page is the moderation panel, which is why that one gets a `ui` interface and a deep link.

**The address you embed must be one the reader's browser can reach**, which in practice means a public one — a Tor or `.local` address works for you and not for your visitors. It also has to be in the website allowlist, or the browser's cross-origin check will block it.

## Installation and First-Run Flow

Install seeds the configuration and the store, then raises one critical task: set the admin password. **Until that is done the panel would be served unauthenticated**, which is what the task exists to prevent.

Websites are deliberately **not** gated the same way. The placeholder in the allowlist means Isso starts without any user input, and real origins can be added whenever — a server with no websites yet is a valid state, an unauthenticated moderation panel is not.

Once running, the sequence is: add your website's origin, generate the embed snippet, and paste it into your site.

## Actions

Five actions, three of them in a configuration group.

### Set Admin Password

Generates the moderation panel's password and shows it once. Run it when its task appears, or to rotate the credential.

- **What it changes:** the password in `isso.cfg`.
- **Cost:** the service restarts to pick it up.
- **Repeat safety:** each run generates a **new** password and invalidates the old one.

### Websites — Configure group

The list of website origins allowed to embed comments from this server.

- **What it changes:** the allowlist in `isso.cfg`.
- **Repeat safety:** idempotent.
- **This is a CORS allowlist, and it is what makes embedding work.** An origin missing from it gets its comment requests blocked by the visitor's browser, which presents as comments simply not loading, with nothing in Isso's logs.
- **The placeholder entry is kept automatically** and is not shown in the form.

### Server — Configure group

Moderation, spam protection, rate limiting, which fields are required, the edit window, avatars, and the recent-comments endpoint.

- **What it changes:** the corresponding sections of `isso.cfg`.
- **Cost:** applies on restart.
- **Repeat safety:** idempotent.
- **Moderation is the setting with the most visible effect** — with it on, comments are held until approved in the panel rather than appearing immediately.
- **Unapproved comments are purged after a period**, so a moderation queue left unattended eventually empties itself.

### Email Notifications — Configure group

Points Isso's notifications at the server's own SMTP or a custom server.

- **What it changes:** the selection in the store, and the resolved credentials in `isso.cfg`.
- **Cost:** applies on restart.
- **Repeat safety:** idempotent.
- **Without it, notifications go nowhere useful** — Isso's default is to write them to its own log, which is fine for a test and useless for moderation.

### Embed Code

Generates the snippet to paste into your website, with a chosen server address already filled in.

- **What it changes:** nothing. It is a read.
- **Repeat safety:** read-only.
- **Input:** which of this service's addresses to embed. **Pick the one your visitors can reach** — the action offers what exists, and cannot know which is public.

## Tasks

One.

| Task               | Severity   | Raised when                       | Cleared when    |
| ------------------ | ---------- | --------------------------------- | --------------- |
| Set Admin Password | `critical` | The configuration has no password | The action runs |

It is keyed on the configuration rather than on install, so it also appears if the password is ever cleared.

`critical` blocks the service from starting and suspends the ordinary controls, so a fresh install shows the task and nothing else.

## Health Checks

One check, on the only daemon.

| Check     | Displayed as  | Method                 |
| --------- | ------------- | ---------------------- |
| `primary` | "Isso Server" | Port 8080 is listening |

It reports that the server is answering, which is not the same as comments working on your site. **The two common failures are both invisible here**: an origin missing from the allowlist, and an embedded address the visitor's browser cannot reach. Both present as comments not loading, and both are diagnosed in the browser's console rather than on this page.

## Backups and Restore

The `main` volume is copied wholesale — `sdk.Backups.ofVolumes('main')`. That is every comment, the configuration, and the store.

**A plain copy is consistent here** because the database is a single SQLite file and StartOS stops the service before taking a backup — there is no partially-written state to catch.

A restored instance comes back with its comments, its allowlist, and the same admin password. The embed snippet on your website keeps working provided the restored server is reachable at the same address you embedded.

## Limitations and Differences

1. **The embedded address is baked into your website**, so moving the server to a different address means updating the snippet everywhere it appears.
2. **An origin missing from the allowlist fails silently** from Isso's side — the block happens in the visitor's browser.
3. **The configuration is action-managed.** Hand edits to `isso.cfg` are overwritten by the next action that touches that section.
4. **A placeholder origin is always in the allowlist** and cannot be removed.
5. **Notifications go to the log until SMTP is configured.**
6. **Both interfaces share one port.** The split exists for discoverability, so restricting one does not restrict the other.
7. **The admin password can be rotated but not chosen**, and rotating it restarts the service.

---

## Quick Reference for AI Consumers

```yaml
package_id: isso
image: ghcr.io/isso-comments/isso # pinned by digest as well as tag
architectures:
  - x86_64
  - aarch64
subcontainers:
  - isso-sub
volumes:
  main:
    db: /db
    config: /config
file_models:
  - isso.cfg # every Isso setting; written by the actions
  - start9/store.json # the SMTP selection only
startos_managed_env_vars: []
dependencies: []
interfaces: # both on port 8080; one server, split for discoverability
  comments: { type: api, port: 8080 } # the address to embed
  admin: { type: ui, port: 8080, path: /admin/ }
actions:
  - set-websites
  - configure-server
  - configure-smtp
  - set-admin-password
  - embed-code
tasks:
  - { action: set-admin-password, severity: critical }
health_checks:
  - primary # displayed "Isso Server"; says nothing about embedding
```
