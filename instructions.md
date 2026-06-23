# Isso

## Documentation

- [Isso documentation](https://isso-comments.de/docs/) — the upstream configuration and usage reference.

## What you get on StartOS

- A self-hosted Isso comment server that embeds comments into your own web pages.
- Two interfaces: **Isso Server** (the address your pages load comments from) and **Moderation Panel** (Isso's `/admin`, where you approve and manage comments).
- Comments stored in a local SQLite database on your server.
- An admin password you create — and rotate anytime — with the **Set Admin Password** action.
- Moderation, spam protection, and email notifications under **Configure** — the **Server** and **Email Notifications** actions.

## First start

After install, StartOS shows a single setup task: run **Set Admin Password** to
generate the password for the Moderation Panel. The panel is always
password-protected, so the service stays stopped until you do this. Isso then
starts right away — it ships with a `localhost` placeholder origin, so you don't
have to add a website first just to get it running.

To actually show comments on your own pages, run **Configure → Websites** and add
the origin(s) of the site(s) that will embed them, including the scheme — e.g.
`https://blog.example.com/`. (You'll never see the `localhost` placeholder; it's
kept automatically so Isso's CORS allowlist is never empty.)

## Make the Isso Server reachable by your visitors

Each visitor's browser loads comments **directly from the Isso Server**, cross-origin from your page — so the Isso Server has to be reachable at an HTTPS address that browser already trusts. Pick the option that matches your audience; the address you choose is the one that goes in the embed snippet.

- **A public website.** On the **Isso Server** interface, choose **Add Domain → Public Domain**, enter a domain you control, and pick **Let's Encrypt** as the certificate authority — every browser trusts Let's Encrypt, so comments load for all of your visitors. **A bare public IP address will not work:** certificate authorities don't issue trusted certificates for IP addresses, so an IP falls back to your server's Root CA, which visitors' browsers don't trust (the comments silently fail to load). Use a domain.

- **A Tor (`.onion`) site.** Add a Tor onion address to the Isso Server interface (through the Tor service). It works for visitors using Tor Browser.

- **Only you, or a private group.** The LAN or `.local` address is fine — but only on devices on the LAN that have also downloaded and trusted your server's Root CA. Don't use it for a public audience.

## Add comments to your pages

1. Run the **Embed Code** action, **select the address** to embed from (the trusted address from the step above), and copy the snippet it returns (shown here with a domain, `https://comments.example.com`):
   ```html
   <script
     data-isso="https://comments.example.com/"
     src="https://comments.example.com/js/embed.min.js"
   ></script>
   <section id="isso-thread"></section>
   ```
2. Paste it into each page where comments should appear.
3. The page's own origin must be listed under **Configure → Websites**, or the browser's CORS check blocks the comments.

## Moderating comments

Open the **Moderation Panel** interface and log in with the password from **Set Admin Password** — there is no username, just the password. From there you can approve, edit, and delete comments. Run **Set Admin Password** again to set a new one.

## Email notifications (optional)

Run **Configure → Email Notifications** to receive new-comment notifications (with one-click approve/delete links) over SMTP. You can use your server's **system SMTP** (set up once in StartOS settings) or a **custom** SMTP server, plus the recipient address. Keep moderation on whenever notifications are enabled.
