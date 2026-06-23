export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Isso!': 0,
  'Isso Server': 1,
  'The Isso server is ready': 2,
  'The Isso server is starting': 3,

  // interfaces.ts
  'The Isso commenting server — embed comments from this address.': 4,
  'Moderation Panel': 5,
  'The Isso moderation panel. Log in with the Set Admin Password credential.': 6,

  // actions/configure/websites.ts
  Websites: 7,
  "The website origin(s) allowed to embed and load comments (Isso's CORS allowlist). At least one is required for comments to work.": 8,
  'Enter a full origin including the scheme, e.g. https://blog.example.com/': 9,
  'Choose which website(s) may embed your Isso comments': 10,

  // actions/configure/server.ts
  'Use a number and unit, e.g. 15m, 2h, 7d, or 1h30m.': 11,
  'Enable Spam Protection': 12,
  'Rate-limit comments per IP and apply basic abuse protection. Recommended in production.': 13,
  'Rate Limit': 14,
  'Maximum number of new comments allowed per minute per IP.': 15,
  'per minute': 16,
  'Require Name': 17,
  'Force commenters to enter a name (not validated).': 18,
  'Require Email': 19,
  'Force commenters to enter an email address (not validated).': 20,
  'Allow Reply To Self': 21,
  'Let commenters reply to their own comments.': 22,
  'Comment Moderation': 23,
  'Hold new comments in a queue until you approve them in the admin panel. Recommended.': 24,
  'Edit Window': 25,
  'How long a visitor may edit or delete their own comment after posting, e.g. 15m, 2h, 7d.': 26,
  'Purge Unapproved Comments After': 27,
  'Remove still-unapproved comments from the moderation queue after this period, e.g. 30d.': 28,
  'Gravatar Avatars': 29,
  'Show Gravatar profile images next to comments.': 30,
  'Enable /latest Endpoint': 31,
  'Serve the /latest endpoint that returns recent comments across all threads.': 32,
  'Spam Protection': 33,
  'Rate limiting and comment requirements.': 34,
  Server: 35,
  'Moderation, edit window, spam protection, and display options.': 36,

  // actions/configure/smtp.ts
  'Notification Recipient': 37,
  'Email address that receives new-comment moderation notifications. Required when email notifications are enabled.': 38,
  'Reply Notifications': 39,
  'Let visitors subscribe to email notifications for replies to their own comment. Keep moderation on to avoid spam abuse.': 40,
  'Email Notifications': 41,
  'Send new-comment moderation notifications over SMTP, with one-click approve/delete links.': 42,

  // actions/setAdminPassword.ts
  'Set Admin Password': 43,
  'Generate a new random password for the Isso moderation panel at /admin. Run this again at any time to reset it.': 44,

  // actions/embedCode.ts
  'Server Address': 45,
  'Choose the address your visitors will load comments from. For a public site, use a public domain (see the Instructions tab).': 46,
  'Embed Code': 47,
  'Get the HTML snippet to add comments to your website': 48,

  // init/watchSetup.ts
  'Set the website(s) that will embed Isso comments': 49,
  'Create the admin password for the moderation panel': 50,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
