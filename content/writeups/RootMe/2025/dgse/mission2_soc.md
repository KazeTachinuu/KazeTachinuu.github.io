---
title: "Analyse des logs"
categories: SOC
cat: "chal"
solved: false
date: 2025-04-12T00:00:00Z
draft: false
description: "Mission 2: Analyse des logs via le SOC"
---

{{< section type="info" title="Challenge Information" icon="info-circle" >}}
L'organisation alliée Nuclear Punk ayant subi une attaque par l'entité nous a fourni ses logs afin de nous aider à comprendre les techniques utilisées par les attaquants.

Pour identifier le groupe attaquant, vous devez récupérer le CWE de la première vulnérabilité utilisée par l'attaquant, le CWE de la seconde vulnérabilité utilisée par l'attaquant, l'adresse IP du serveur sur lequel l'attaquant récupère ses outils ainsi que le chemin arbitraire du fichier permettant la persistance.

Exemple de données :
- CWE de la première vulnérabilité : `SQL Injection` -> `CWE-89` ;
- CWE de la seconde vulnérabilité : `Cross-Site Scripting` -> `CWE-79` ;
- IP : `13.37.13.37` ;
- Chemin du fichier : `/etc/passwd` ;

Format de validation : `RM{CWE-89:CWE-79:13.37.13.37:/etc/passwd}`
{{< /section >}}

{{< section type="assignment" title="Mission Objectives" icon="tasks" >}}
- Analyser les logs via le SOC.
- Identifier des indicateurs de compromission (IoC) et des indicateurs d'attaque (IoA).
{{< /section >}}

{{< section type="note" title="Analyse des logs" icon="server" >}}
{{< /section >}}


