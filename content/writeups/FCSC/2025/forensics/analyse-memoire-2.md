---
title: "Analyse mémoire 2/5 - Origine de la menace"
categories: Forensics
cat: "chal"
difficulty: "⭐"
solved: true
date: 2025-04-19T00:00:00Z
draft: false
description: "Identification du processus ayant chargé le malware en mémoire."
---

{{< section type="info" title="Description du challenge" icon="info-circle" >}}
Dans la première partie, nous avons identifié un malware s'exécutant via `rundll32.exe` (PID 1800) qui exfiltre des données. Pour comprendre la chaîne d'infection, nous devons maintenant identifier le processus qui a chargé ce malware en mémoire.

Le flag est au format : `FCSC{<process_name>:<process_id>}` où :
- `process_name` est le nom du processus à l'origine de l'exécution du malware
- `process_id` est le PID de ce processus
{{< /section >}}

{{< section type="note" title="Analyse de l'arbre des processus" icon="sitemap" >}}

### 1. Extraction de la hiérarchie des processus

Pour visualiser les relations parent-enfant entre les processus, nous utilisons le plugin PsTree de Volatility :

```bash
vol -f analyse-memoire.dmp windows.pstree.PsTree
```

La sortie nous montre l'arbre complet des processus avec :
- L'indentation indique la relation parent-enfant
- Pour chaque processus : PID, PPID (Parent PID), nom et arguments

### 2. Identification du processus parent

Dans l'arbre des processus, nous trouvons :

```bash
** 800 656 services.exe
** 936 800 svchost.exe -k DcomLaunch
*** 1800 936 rundll32.exe
*** 5512 936 RuntimeBroker.exe
*** 7184 936 SkypeApp.exe
```

Cette structure nous révèle que :
1. Notre malware (`rundll32.exe`, PID 1800) a été lancé par `svchost.exe`
2. Le PID du processus parent est 936
3. Ce `svchost.exe` s'exécute avec l'argument `-k DcomLaunch`
{{< /section >}}

{{< section type="note" title="Analyse du contexte" icon="magnifying-glass" >}}

Le fait que le malware soit chargé par `svchost.exe` est particulièrement intéressant car :

1. **Rôle de svchost.exe** :
   - C'est l'hôte de service Windows, utilisé pour exécuter des DLL en tant que services
   - Il est souvent ciblé par les malwares car :
     - Il est légitime et toujours présent
     - Il peut charger des DLL
     - Plusieurs instances s'exécutent normalement

2. **Argument DcomLaunch** :
   - Ce groupe de service gère l'activation DCOM
   - Il a des privilèges élevés
   - C'est un vecteur d'attaque connu pour l'injection de code
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
Avec nos découvertes :
- Processus loader : `svchost.exe`
- PID : `936`

{{< flag "FCSC{svchost.exe:936}" >}}
{{< /section >}}

{{< section type="info" title="Résumé" icon="list" >}}
1. Utilisation de PsTree pour visualiser la hiérarchie des processus
2. Identification du parent direct de rundll32.exe
3. Analyse du contexte de svchost.exe et son rôle dans l'infection
4. Construction du flag avec le nom et PID du processus parent
{{< /section >}} 