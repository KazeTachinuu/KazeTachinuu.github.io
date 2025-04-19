---
title: "Analyse mémoire 1/5 - Exfiltration"
categories: Forensics
cat: "chal"
difficulty: "⭐"
points: "250"
solved: true
date: 2025-04-19T00:00:00Z
draft: false
description: "Analyse d'une capture mémoire pour identifier un malware exfiltrant des données."
---

{{< section type="info" title="Description du challenge" icon="info-circle" >}}
Un agent du FCSC démarre son ordinateur pour réfléchir et noter des idées de challenges pour l'année prochaine. Il nous a cependant alerté que lors du démarrage, un étrange écran rouge est apparu à peine une seconde, puis le poste a démarré normalement.

Il a pu commencer son travail sans souci, mais afin de s'assurer que le problème ne vienne pas d'un potentiel malware, nous lui avons fait capturer la mémoire du poste avec l'outil DumpIt.

Notre objectif est d'analyser la mémoire et retrouver le malware qui tente d'exfiltrer le document.
{{< /section >}}

{{< section type="note" title="Analyse avec Volatility" icon="search" >}}

### 1. Identification du profil Windows

Première étape : vérifier que nous pouvons analyser correctement l'image mémoire :

```bash
vol -f analyse-memoire.dmp windows.info.Info
```

Résultat :
```
Kernel Base 0xf80381800000
DTB 0x1ad000
Is64Bit True
MachineType 34404
Major/Minor 15.19041
NtSystemRoot C:\Windows
NtProductType NtProductWinNt
NtMajorVersion 10
NtMinorVersion 0
```

Nous avons bien affaire à un Windows 10 64 bits (build 19041).

### 2. Analyse des connexions réseau

Pour identifier le malware qui exfiltre des données, nous allons examiner toutes les connexions réseau actives :

```bash
vol -f analyse-memoire.dmp windows.netscan.NetScan
```

Cette commande nous liste toutes les connexions TCP/UDP avec :
- Le protocole utilisé
- Les adresses source et destination
- L'état de la connexion
- Le PID et nom du processus associé
{{< /section >}}

{{< section type="note" title="Identification du malware" icon="lightbulb" >}}

En analysant la sortie, nous repérons plusieurs connexions ESTABLISHED vers des adresses externes :

```
Offset Proto LocalAddr  LocalPort ForeignAddr     ForeignPort State    PID   Owner
...
0xa50a2752fab0 TCPv4 10.0.2.15 49683 20.199.120.182 443 ESTABLISHED 3024 svchost.exe
0xa50a27bdd460 TCPv4 10.0.2.15 59261 48.209.108.37 443 ESTABLISHED 2040 MsMpEng.exe
0xa50a297cd270 TCPv4 10.0.2.15 58828 185.89.210.248 443 ESTABLISHED 7232 msedge.exe
0xa50a29eaea60 TCPv4 10.0.2.15 49709 100.68.20.103 443 ESTABLISHED 1800 rundll32.exe
0xa50a29f8b2a0 TCPv4 10.0.2.15 57158 35.214.168.80 443 ESTABLISHED 7232 msedge.exe
```

La connexion suspecte est celle utilisant `rundll32.exe` pour plusieurs raisons :

1. **Rôle légitime détourné** :
   - `rundll32.exe` est un utilitaire Windows qui charge des DLL et exécute leurs fonctions exportées
   - Il est normalement utilisé par Windows pour des tâches système ponctuelles
   - Il ne devrait pas maintenir de connexion réseau persistante

2. **Comportement anormal au démarrage** :
   - La connexion est établie dès le démarrage du système
   - Les autres processus avec des connexions actives sont des services Windows légitimes (`svchost.exe`, `MsMpEng.exe` - Windows Defender) ou le navigateur (`msedge.exe`)



{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
Le format demandé est : `FCSC{<process_name>:<process_id>:<adresse_ip_distante>:<port_distant>:<protocole>}`

Avec nos découvertes :
- Process : `rundll32.exe`
- PID : `1800`
- IP distante : `100.68.20.103`
- Port : `443`
- Protocole : `TCP`

{{< flag "FCSC{rundll32.exe:1800:100.68.20.103:443:TCP}" >}}
{{< /section >}}

{{< section type="info" title="Résumé" icon="list" >}}
1. Analyse de la capture mémoire avec Volatility 3
2. Identification du système Windows 10 64 bits
3. Extraction des connexions réseau actives
4. Repérage d'une connexion suspecte via `rundll32.exe`
5. Construction du flag avec les informations trouvées
{{< /section >}} 