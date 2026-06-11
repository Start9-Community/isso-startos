# Isso

Isso is a lightweight, self-hosted commenting server, similar to Disqus, that
lets visitors comment on your website without giving up their data to a third
party. Comments live in a SQLite database on your StartOS server and are
embedded into your pages with a small JavaScript snippet.

## First start

1. Run the **Configure** action and set **Websites** to the origin(s) of the
   site(s) that will show comments, one per line, including the scheme:
   ```
   https://blog.example.com/
   ```
   At least one website is required, otherwise comments will not load (this is
   Isso's CORS protection).
2. Leave **Comment Moderation** on (recommended) so new comments wait for your
   approval.
3. Save. The server restarts with your settings.

## Adding comments to your site

Run the **Embed Code** action and copy the HTML snippet into any page where you
want comments to appear:

```html
<script data-isso="https://<your-isso-address>/"
        src="https://<your-isso-address>/js/embed.min.js"></script>
<section id="isso-thread"></section>
```

The page's origin must be listed under **Websites** in the Configure action.

## Moderating comments

Run the **Admin Login** action to get the moderation panel URL (`/admin`) and
the auto-generated admin password. There is no username, log in with the
password alone. From there you can approve, edit, and delete comments.

## Email notifications (optional)

Open the **Configure** action, expand **Email Notifications (SMTP)**, and enable
it to receive new-comment notifications with one-click approve/delete links. It
is strongly recommended to keep moderation on whenever notifications or reply
notifications are enabled.

## Backups

The comments database, configuration, and admin password are all stored on the
service's data volume and are included in StartOS backups.
