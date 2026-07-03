# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (architecture, for developers and LLMs) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Package id is `isso`.** Both the `comments` (api — the embed/comment server) and `admin` (ui — the moderation panel deep-link) interfaces bind on the single `main` host — look them up by their interface id after fetching that host. The host id and interface ids are exported from `startos/interfaces.ts` (`mainHostId` / `commentsInterfaceId` / `adminInterfaceId`); use those constants, not string literals.
- **`isso.cfg` is Python configparser, not INI.** `FileHelper.ini` can't round-trip its newline-indented continuation lists (`host`), so `startos/fileModels/issoCfg.ts` uses `FileHelper.raw` with a hand-written serializer/parser that preserves unmodeled hand-edited keys. Don't swap it back to `FileHelper.ini`.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach isso -n isso-sub -- <cmd>`. Select the subcontainer by **name** with `-n` (the name passed to `SubContainer.of` in `main.ts` — here `isso-sub`) or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
