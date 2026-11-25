import { VersionInfo, IMPOSSIBLE } from '@start9labs/start-sdk'
import { issoCfg } from '../fileModels/issoCfg'
import { storeJson } from '../fileModels/store.json'
import { smtpPasswordRef } from '../utils'

export const current = VersionInfo.of({
  version: '0.14.0:9',
  releaseNotes: {
    en_US: `**Security**

- The SMTP password is no longer written to Isso's configuration file. When email notifications use the server's SMTP, that password is no longer in this service's data or its backups. A backup made before this update keeps it until the next backup of Isso to the same location replaces it. If such a backup may have been exposed, change the password at your email provider.
- A custom SMTP server's password is still in backups, since a restore needs it to send email.`,
    es_ES: `**Seguridad**

- La contraseña SMTP ya no se escribe en el archivo de configuración de Isso. Cuando las notificaciones por correo usan el SMTP del servidor, esa contraseña ya no está en los datos de este servicio ni en sus copias de seguridad. Una copia de seguridad hecha antes de esta actualización la conserva hasta que la siguiente copia de Isso en la misma ubicación la reemplace. Si una copia así pudo quedar expuesta, cambie la contraseña en su proveedor de correo.
- La contraseña de un servidor SMTP personalizado sigue en las copias de seguridad, ya que una restauración la necesita para enviar correo.`,
    de_DE: `**Sicherheit**

- Das SMTP-Passwort wird nicht mehr in die Konfigurationsdatei von Isso geschrieben. Wenn E-Mail-Benachrichtigungen den SMTP-Server des Servers nutzen, ist dieses Passwort nicht mehr in den Daten dieses Dienstes oder in seinen Backups enthalten. Ein vor diesem Update erstelltes Backup behält es, bis das nächste Backup von Isso am selben Ort es ersetzt. Falls ein solches Backup offengelegt worden sein könnte, ändern Sie das Passwort bei Ihrem E-Mail-Anbieter.
- Das Passwort eines eigenen SMTP-Servers ist weiterhin in Backups enthalten, da eine Wiederherstellung es zum Senden von E-Mails braucht.`,
    pl_PL: `**Bezpieczeństwo**

- Hasło SMTP nie jest już zapisywane w pliku konfiguracyjnym Isso. Gdy powiadomienia e-mail korzystają z SMTP serwera, tego hasła nie ma już w danych tej usługi ani w jej kopiach zapasowych. Kopia zapasowa wykonana przed tą aktualizacją zachowuje je, dopóki następna kopia Isso w tym samym miejscu jej nie zastąpi. Jeśli taka kopia mogła zostać ujawniona, zmień hasło u swojego dostawcy poczty.
- Hasło własnego serwera SMTP nadal znajduje się w kopiach zapasowych, ponieważ przywrócenie potrzebuje go do wysyłania poczty.`,
    fr_FR: `**Sécurité**

- Le mot de passe SMTP n’est plus écrit dans le fichier de configuration d’Isso. Lorsque les notifications par e-mail utilisent le SMTP du serveur, ce mot de passe ne figure plus dans les données de ce service ni dans ses sauvegardes. Une sauvegarde faite avant cette mise à jour le conserve jusqu’à ce que la prochaine sauvegarde d’Isso au même emplacement la remplace. Si une telle sauvegarde a pu être exposée, changez le mot de passe auprès de votre fournisseur de messagerie.
- Le mot de passe d’un serveur SMTP personnalisé reste dans les sauvegardes, car une restauration en a besoin pour envoyer des e-mails.`,
  },
  migrations: {
    up: async ({ effects }) => {
      const selection = await storeJson.read((s) => s.smtp).once()
      if (!selection || selection.selection === 'disabled') return
      if (!(await issoCfg.read().once())) return
      await issoCfg.merge(effects, { smtp: { password: smtpPasswordRef } })
    },
    down: IMPOSSIBLE,
  },
})
