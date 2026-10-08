import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.0:4',
  releaseNotes: {
    en_US: `- Set Admin Password asks for confirmation before replacing an existing password.
- Embed Code shows the snippet on separate lines, as it is pasted into a page.
- The descriptions of Spam Protection, Allow Reply To Self, Comment Moderation and Gravatar Avatars explain what each setting does.`,
    es_ES: `- Establecer contraseña de administrador pide confirmación antes de reemplazar una contraseña existente.
- Código de inserción muestra el fragmento en líneas separadas, tal como se pega en una página.
- Las descripciones de Protección contra spam, Permitir responderse a sí mismo, Moderación de comentarios y Avatares de Gravatar explican qué hace cada ajuste.`,
    de_DE: `- „Admin-Passwort festlegen“ fragt vor dem Ersetzen eines vorhandenen Passworts nach einer Bestätigung.
- „Einbettungscode“ zeigt das Snippet auf getrennten Zeilen, so wie es in eine Seite eingefügt wird.
- Die Beschreibungen von „Spam-Schutz“, „Antworten auf eigene Kommentare erlauben“, „Kommentarmoderation“ und „Gravatar-Avatare“ erklären, was die jeweilige Einstellung bewirkt.`,
    pl_PL: `- „Ustaw hasło administratora” prosi o potwierdzenie przed zastąpieniem istniejącego hasła.
- „Kod do osadzenia” pokazuje fragment w osobnych wierszach, tak jak wkleja się go na stronę.
- Opisy ustawień „Ochrona przed spamem”, „Zezwalaj na odpowiedzi na własne komentarze”, „Moderacja komentarzy” i „Awatary Gravatar” wyjaśniają, co robi każde z nich.`,
    fr_FR: `- Définir le mot de passe administrateur demande une confirmation avant de remplacer un mot de passe existant.
- Code d'intégration affiche l'extrait sur des lignes séparées, tel qu'il se colle dans une page.
- Les descriptions de Protection anti-spam, Autoriser la réponse à soi-même, Modération des commentaires et Avatars Gravatar expliquent ce que fait chaque réglage.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
