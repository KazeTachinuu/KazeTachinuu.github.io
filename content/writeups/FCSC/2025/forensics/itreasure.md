---
title: "iForensics - iTreasure"
categories: Forensics
cat: "chal"
difficulty: "⭐"
points: "183"
solved: true
date: 2025-04-19T00:00:00Z
draft: false
description: "Analyse d'un backup iOS pour retrouver un trésor caché dans les messages."
---

{{< section type="info" title="Description du challenge" icon="info-circle" >}}
Lors d'un passage de douane, le douanier demande de remettre le téléphone et son code de déverrouillage. Le téléphone est rendu quelques heures plus tard.

Suspicieux, le propriétaire envoie son téléphone pour analyse au CERT-FR de l'ANSSI. Les analystes effectuent une collecte composée d'un sysdiagnose et d'un backup.

Avant la remise du téléphone à la douane, le propriétaire a eu le temps d'envoyer un trésor.
{{< /section >}}

{{< section type="note" title="1. Analyse du backup" icon="database" >}}

### Exploration des fichiers du backup

Le backup est fourni sous forme d'archive `backup.tar.xz`. Après décompression, nous trouvons :
- Des fichiers nommés en hexadécimal (00, 01, ..., ff)
- Une base de données `Manifest.db` qui contient la correspondance entre les fichiers et leurs chemins originaux

```bash
# Lister les correspondances fichier → chemin
sqlite3 Manifest.db \
  "SELECT fileID, domain||'/'||relativePath FROM Files;" \
| head -n 10

# Output:
# 3d0d7e5fb2ce288813306e4d4636395e047a3d28|Library/SMS/sms.db
# 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t|Library/Notes/NoteStore.sqlite
# ...
```
{{< /section >}}

{{< section type="note" title="2. Recherche des messages" icon="message" >}}

### Localisation de la base de données SMS

Nous cherchons spécifiquement la base de données des messages SMS :

```bash
sqlite3 Manifest.db \
  "SELECT fileID, relativePath
   FROM Files
   WHERE relativePath LIKE '%SMS/sms.db%';"

# Output:
# 3d0d7e5fb2ce288813306e4d4636395e047a3d28|Library/SMS/sms.db

# Extraction de la base SMS
cp 3d0d7e5fb2ce288813306e4d4636395e047a3d28 sms.db
```

### Analyse des messages

1. **Structure de la base** :
```bash
# Vérification des tables
sqlite3 sms.db ".tables"

# Output:
# _SqliteDatabaseProperties  message
# attachment                message_attachment_join
# chat                      message_processing_task
# chat_handle_join          recoverable_message_part
# chat_message_join         sync_deleted_attachments
# chat_recoverable_message_join  sync_deleted_chats
# deleted_messages          sync_deleted_messages
# handle                    unsynced_removed_recoverable_messages
# kvtable
```

2. **Recherche de messages suspects** :
```bash
sqlite3 -header -column sms.db \
"SELECT
   datetime(m.date/1000,'unixepoch','localtime') AS date,
   h.id AS contact,
   m.text AS message
 FROM message AS m
 LEFT JOIN handle AS h
   ON h.ROWID = m.handle_id;"

# Output:
# date                     contact                    message
# -----------------------  -------------------------  -------------------------------------
# 2025-04-07 06:29:04     robertswigert@icloud.com  Do you want to have my precious secret ?
```
{{< /section >}}

{{< section type="note" title="3. Analyse des pièces jointes" icon="file-image" >}}

### Extraction des pièces jointes

```bash
sqlite3 -header -column sms.db \
"SELECT
   m.ROWID AS msg_id,
   datetime(m.date/1000,'unixepoch') AS date,
   h.id AS contact,
   a.filename,
   a.mime_type
 FROM message_attachment_join AS mj
 JOIN attachment AS a ON a.ROWID = mj.attachment_id
 JOIN message AS m ON m.ROWID = mj.message_id
 LEFT JOIN handle AS h ON h.ROWID = m.handle_id
 ORDER BY m.date DESC
 LIMIT 5;"

# Output:
# msg_id  date                     contact                    filename                                                                  mime_type
# ------  -----------------------  -------------------------  ------------------------------------------------------------------------  ----------
# 5       2025-04-07 06:29:04     robertswigert@icloud.com  ~/Library/SMS/Attachments/9e/14/4C3DF366-1CE1-42F1-9570-C76206181041/...  image/heic
# 6       2025-04-07 06:29:04     robertswigert@icloud.com  ~/Library/SMS/Attachments/9e/14/4C3DF366-1CE1-42F1-9570-C76206181041/...  image/heic
```

Nous identifions deux fichiers HEIC identiques. Pour les extraire :

```bash
# Recherche du fichier dans Manifest.db
sqlite3 Manifest.db \
  "SELECT fileID
   FROM Files
   WHERE relativePath LIKE '%679329D1-12E7-45F2-A082-1E58A6CB454F.HEIC%';"

# Extraction du fichier
cp <fileID> msg_6793.heic
```
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
En ouvrant l'image HEIC, nous trouvons le flag !

{{< figure src="/images/writeups/fcsc/2025/forensics/itreasure/msg_6793.jpg" alt="Flag" >}}

{{< flag "FCSC{511773550dca}" >}}
{{< /section >}}

{{< section type="info" title="Résumé" icon="list" >}}
1. Analyse du backup iOS et de sa structure
2. Extraction et analyse de la base de données SMS
3. Identification et extraction des pièces jointes suspectes
4. Analyse de l'image HEIC
{{< /section >}} 