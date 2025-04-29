---
title: "iForensics - iCrash"
categories: "Forensics"
cat: "chal"
solved: true
difficulty: "⭐"
date: 2025-04-18T00:00:00Z
draft: false
description: "Retrouver le SSID, le BSSID et le compte iCloud à partir d'un backup et d'un sysdiagnose iOS."
---

{{< section type="info" title="Sujet" icon="info-circle" >}}
On nous demande de retrouver trois informations sur un iPhone à partir d'un backup et d'un sysdiagnose :
- Le **SSID** du réseau WiFi auquel il est connecté
- Le **BSSID** (adresse MAC du point d'accès WiFi)
- Le **compte iCloud** associé

Le flag doit être au format :
`FCSC{<SSID>|<BSSID>|<compte iCloud>}`
{{< /section >}}

{{< section type="note" title="1. Extraction du SSID et du BSSID" icon="wifi" >}}

**a. Méthode**

Les informations WiFi sont stockées dans plusieurs fichiers sur iOS, mais le plus simple est de fouiller les logs du sysdiagnose, qui contiennent des traces de connexion WiFi.

**b. Recherche**

On utilise `grep` pour trouver les occurrences de `ssid` et `bssid` dans les fichiers du backup et du sysdiagnose :
```bash
grep -i -r 'ssid' .
grep -i -r 'bssid' .
```

**c. Résultat**

Dans les fichiers de logs WiFi, on trouve :
```
NetManagerState.txt: @0x10826e158 BSSID=66:20:95:6c:9b:37 ... ssid[ 4]='FCSC'
```
On retrouve aussi le SSID dans d'autres fichiers :
```
JoinManagerState.txt: ... ssid='FCSC' ...
```

**Conclusion :**
- **SSID** = `FCSC`
- **BSSID** = `66:20:95:6C:9B:37`
{{< /section >}}

{{< section type="note" title="2. Extraction du compte iCloud" icon="user-circle" >}}

**a. Méthode**

Le compte iCloud est souvent visible dans les fichiers de préférences, de comptes, ou dans les logs.
On cherche toutes les adresses e-mail avec un `@` :
```bash
grep -a -r '@' .
```

**b. Résultat**

On retrouve l'adresse suivante dans de nombreux fichiers :
```
robertswigert@icloud.com
```
Elle apparaît dans :
- Les fichiers de configuration de comptes (`com.apple.accountsd.plist`, etc.)
- Les fichiers de calendrier, de reminders, de mail, etc.

**Conclusion :**
- **Compte iCloud** = `robertswigert@icloud.com`
{{< /section >}}

{{< section type="success" title="3. Assemblage du flag" icon="flag" >}}
On assemble les trois informations au format demandé :
{{< flag "FCSC{FCSC|66:20:95:6C:9B:37|robertswigert@icloud.com}" >}}
{{< /section >}}

{{< section type="info" title="4. Résumé des commandes utilisées" icon="list-ol" >}}
```bash
# Recherche du SSID et BSSID
grep -i -r 'ssid' .
grep -i -r 'bssid' .

# Recherche du compte iCloud
grep -a -r '@' .
```
{{< /section >}}
