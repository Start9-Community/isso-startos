import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.0:7',
  releaseNotes: {
    en_US: `Updates Isso to the current upstream build of 0.14.0. Comment pages no longer keep a stale thread, the admin panel refreshes its counts after moderation, and the spam guard tells a commenter why a post was rejected. Also includes upstream fixes for comment verification and edit links.`,
    es_ES: `Actualiza Isso a la compilación actual de la versión 0.14.0. Las páginas de comentarios ya no conservan un hilo desactualizado, el panel de administración actualiza sus conteos tras moderar y la protección antispam indica por qué se rechazó un mensaje. También incluye correcciones de la verificación de comentarios y de los enlaces de edición.`,
    de_DE: `Aktualisiert Isso auf den aktuellen Upstream-Build von 0.14.0. Kommentarseiten behalten keinen veralteten Thread mehr, das Admin-Panel aktualisiert seine Zähler nach der Moderation, und der Spamschutz nennt den Grund einer Ablehnung. Enthält außerdem Upstream-Korrekturen für die Kommentarprüfung und Bearbeitungslinks.`,
    pl_PL: `Aktualizuje Isso do bieżącej kompilacji 0.14.0. Strony komentarzy nie zachowują już nieaktualnego wątku, panel administracyjny odświeża liczniki po moderacji, a ochrona antyspamowa podaje powód odrzucenia wpisu. Zawiera też poprawki weryfikacji komentarzy i linków edycji.`,
    fr_FR: `Met Isso à jour avec la version amont actuelle de 0.14.0. Les pages de commentaires ne gardent plus un fil périmé, le panneau d'administration rafraîchit ses compteurs après modération, et la protection anti-spam indique pourquoi un message a été refusé. Inclut aussi des correctifs de vérification des commentaires et des liens d'édition.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
