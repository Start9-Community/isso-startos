# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Never let the CORS allowlist go empty.** Isso refuses to start without one, so the file model seeds a placeholder origin and the Websites action always re-appends it, hidden from the form. That is what lets the service boot before the user has added a real website.
- **The comments interface is `type: 'api'` on purpose.** Its root is Isso's API — a browser GET returns "missing uri query" — so only the `/admin/` deep link is a `ui`.
- **`isso.cfg` is the source of truth for every setting; `store.json` holds only the SMTP _selection_.** The config file can hold concrete credentials but not the fact that they came from the system SMTP, which is why the selection is kept separately for the form to pre-fill.
- **Both file models are seeded on every init**, not just install, so schema defaults added in a later version land on upgrade and both files exist before `main` and the daemon read them.
- **The image declares separate `/db` and `/config` volumes**, so the one `main` volume is mounted twice by subpath. Keep the subpaths and mountpoints in step with `utils.ts`.
