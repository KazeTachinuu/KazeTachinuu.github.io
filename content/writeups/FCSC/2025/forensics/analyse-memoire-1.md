---
title: "Analyse mémoire 1/5 - Exfiltration"
categories: Forensics
cat: "chal"
difficulty: "⭐"
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

{{< section type="note" title="1. Analyse préliminaire de l'image mémoire" icon="search" >}}

Avant toute analyse, il est essentiel de vérifier que l'image mémoire est exploitable et d'identifier le profil du système (version de Windows, architecture, etc.).

### Identification du profil Windows

On utilise Volatility 3, un outil d'analyse forensique de la mémoire RAM, pour obtenir des informations sur le système :

```bash
vol -f analyse-memoire.dmp windows.info.Info
```

**Pourquoi cette commande ?**
- Elle permet de vérifier que l'image mémoire est lisible par Volatility.
- Elle donne des informations cruciales : version de Windows, architecture (32/64 bits), base du noyau, etc.
- Cela permet d'adapter les modules d'analyse à la bonne version du système.

Exemple de sortie :
```
Variable        Value

Kernel Base     0xf80381800000
DTB     0x1ad000
Is64Bit True
IsPAE   False
layer_name      0 WindowsIntel32e
memory_layer    1 WindowsCrashDump64Layer
base_layer      2 FileLayer
KdVersionBlock  0xf8038240f400
Major/Minor     15.19041
MachineType     34404
KeNumberProcessors      6
SystemTime      2025-04-01 22:17:18+00:00
NtSystemRoot    C:\Windows
NtProductType   NtProductWinNt
NtMajorVersion  10
NtMinorVersion  0
PE MajorOperatingSystemVersion  10
PE MinorOperatingSystemVersion  0
PE Machine      34404
PE TimeDateStamp        Fri Dec 16 15:04:28 2033
```

On confirme qu'il s'agit d'un Windows 10 64 bits (build 19041).
{{< /section >}}

{{< section type="note" title="2. Recherche des connexions réseau actives" icon="network-wired" >}}

L'objectif est de repérer un éventuel malware qui exfiltre des données. Un bon point de départ est d'examiner toutes les connexions réseau actives au moment de la capture mémoire.

### Extraction des connexions réseau

On utilise le module `windows.netscan.NetScan` de Volatility :

```bash
vol -f analyse-memoire.dmp windows.netscan.NetScan | grep ESTABLISHED
```

**Pourquoi cette commande ?**
- Elle liste toutes les connexions TCP/UDP actives au moment de la capture mémoire.
- Pour chaque connexion, on obtient :
  - Le protocole (TCP/UDP)
  - Les adresses IP et ports locaux/distants
  - L'état de la connexion (ESTABLISHED, LISTENING, etc.)
  - Le PID et le nom du processus associé
- Cela permet d'identifier rapidement les processus qui communiquent avec l'extérieur, ce qui est typique d'une exfiltration.

**Filtrage des connexions actives**

Pour se concentrer sur les connexions actives (celles qui sont réellement établies), on filtre la sortie pour ne garder que les connexions en état ESTABLISHED 


Exemple de sortie :
```
Offset Proto   ForeignAddr     ForeignPort State    PID   Owner
...
0xa50a2752fab0 TCPv4 20.199.120.182 443 ESTABLISHED 3024 svchost.exe
0xa50a27bdd460 TCPv4 48.209.108.37 443 ESTABLISHED 2040 MsMpEng.exe
0xa50a297cd270 TCPv4 185.89.210.248 443 ESTABLISHED 7232 msedge.exe
0xa50a29eaea60 TCPv4 100.68.20.103 443 ESTABLISHED 1800 rundll32.exe
0xa50a29f8b2a0 TCPv4 35.214.168.80 443 ESTABLISHED 7232 msedge.exe
```
{{< /section >}}

{{< section type="note" title="3. Identification du processus malveillant" icon="lightbulb" >}}

On analyse la liste des connexions pour repérer un comportement anormal.

- Plusieurs processus ont des connexions actives :
  - `svchost.exe` : service système Windows (légitime)
  - `MsMpEng.exe` : Windows Defender (légitime)
  - `msedge.exe` : navigateur Edge (légitime)
  - `rundll32.exe` : **à surveiller**

#### Pourquoi `rundll32.exe` est suspect ?

- `rundll32.exe` est un utilitaire Windows qui sert à charger et exécuter des fonctions exportées de DLL.
- Il n'est pas censé maintenir de connexion réseau persistante.
- Sa présence dans les connexions ESTABLISHED, surtout au démarrage, est très inhabituelle.
- Les autres processus sont attendus (services système ou navigateur), mais pas `rundll32.exe`.

On retient donc la connexion suivante comme suspecte :

- Processus : `rundll32.exe`
- PID : `1800`
- IP distante : `100.68.20.103`
- Port distant : `443`
- Protocole : `TCP`
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
Le format demandé est :
`FCSC{<process_name>:<process_id>:<adresse_ip_distante>:<port_distant>:<protocole>}`

En remplissant avec nos valeurs :

{{< flag "FCSC{rundll32.exe:1800:100.68.20.103:443:TCP}" >}}
{{< /section >}}

{{< section type="info" title="Résumé" icon="list" >}}
1. Identification du profil système avec Volatility
2. Extraction des connexions réseau actives (filtrage sur ESTABLISHED)
3. Repérage d'une connexion anormale via `rundll32.exe`
4. Construction du flag avec les informations trouvées
{{< /section >}} 