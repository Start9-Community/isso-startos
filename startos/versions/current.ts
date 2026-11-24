import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.14.0:8',
  releaseNotes: {
    en_US: `Email notifications that use the server's SMTP now follow changes to the server's SMTP settings automatically. Requires StartOS 0.4.2 or newer.`,
    es_ES: `Las notificaciones por correo que usan el SMTP del servidor ahora siguen automáticamente los cambios en la configuración SMTP del servidor. Requiere StartOS 0.4.2 o posterior.`,
    de_DE: `E-Mail-Benachrichtigungen, die den SMTP-Server des Servers nutzen, übernehmen Änderungen an dessen SMTP-Einstellungen jetzt automatisch. Erfordert StartOS 0.4.2 oder neuer.`,
    pl_PL: `Powiadomienia e-mail korzystające z SMTP serwera automatycznie uwzględniają teraz zmiany w ustawieniach SMTP serwera. Wymaga StartOS 0.4.2 lub nowszego.`,
    fr_FR: `Les notifications par e-mail qui utilisent le SMTP du serveur suivent désormais automatiquement les modifications de ses paramètres SMTP. Nécessite StartOS 0.4.2 ou une version ultérieure.`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
