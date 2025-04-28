---
title: "iForensics - Backdoor"
categories: Forensics
cat: "chal"
difficulty: "⭐"
points: "183"
solved: true
date: 2025-04-19T00:00:00Z
draft: false
description: "Analyse d'un backup iOS pour identifier une backdoor dans une application."
---

{{< section type="info" title="Description du challenge" icon="info-circle" >}}
Lors d'un passage de douane, le douanier vous demande de lui remettre votre téléphone ainsi que son code de déverrouillage. Le téléphone vous est rendu quelques heures plus tard.

Suspicieux, vous envoyez votre téléphone pour analyse au CERT-FR de l'ANSSI. Les analystes du CERT-FR effectuent une collecte sur le téléphone, composée d'un sysdiagnose et d'un backup.

Vous continuez vos analyses afin de trouver la backdoor sur le téléphone. Vous finissez par vous rendre compte qu'une application est compromise et que le téléphone était infecté au moment de la collecte.

Trouvez l'identifiant de l'application compromise ainsi que l'identifiant de processus (PID) du malware.
{{< /section >}}

{{< section type="note" title="1. Analyse des processus" icon="process" >}}

### Identification des processus non-système

Nous commençons par examiner les processus en cours d'exécution, en excluant les processus système standards :

```bash
grep -Ev '/(usr|System|sbin|bin)/' ps.txt | head -n 10

# Output:
# mobile    0   99   123     1  …  /var/containers/Bundle/Application/.../WhatsApp.app/WhatsApp
# mobile    0   99   124     1  …  /var/containers/Bundle/Application/.../Telegram.app/Telegram
# root      0   99   279     1  …  /var/containers/Bundle/Application/4B6E715E-641B-4F43-B39B-CA9AE3E8B73B/Signal.app/mussel dGNwOi8vOTguNjYuMTU0LjIzNToyOTU1Mg==
```

Plusieurs éléments attirent notre attention :
1. Un processus nommé `mussel` s'exécute avec des privilèges root
2. Il se trouve dans le dossier d'une application Signal
3. Il prend un argument en base64
4. Son nom n'est pas standard pour une application iOS

### Analyse approfondie du processus suspect

Nous examinons plus en détail le processus `mussel` :

```bash
grep -E 'Signal.app/mussel' ps.txt

# Output:
# root      0   99   279     1  …  /var/containers/Bundle/Application/4B6E715E-641B-4F43-B39B-CA9AE3E8B73B/Signal.app/mussel dGNwOi8vOTguNjYuMTU0LjIzNToyOTU1Mg==
# root      0   99   330     1  …  /var/containers/Bundle/Application/4B6E715E-641B-4F43-B39B-CA9AE3E8B73B/Signal.app/mussel dGNwOi8vOTguNjYuMTU0LjIzNToyOTU1Mg==
# root      0   99   345   344  …  /var/containers/Bundle/Application/4B6E715E-641B-4F43-B39B-CA9AE3E8B73B/Signal.app/mussel dGNwOi8vOTguNjYuMTU0LjIzNToyOTU1Mg==
```

Observations supplémentaires :
1. Plusieurs instances du même processus sont en cours d'exécution
2. Le PID 279 semble être l'instance originale
3. Les autres instances (330, 345) pourraient être des relances après crash
{{< /section >}}

{{< section type="note" title="2. Analyse de l'argument" icon="code" >}}

### Investigation de l'argument base64

L'argument `dGNwOi8vOTguNjYuMTU0LjIzNToyOTU1Mg==` semble être en base64. Nous le décodons :

```bash
echo dGNwOi8vOTguNjYuMTU0LjIzNToyOTU1Mg== | base64 --decode

# Output:
# tcp://98.66.154.235:29552
```

Cette découverte est cruciale car :
1. C'est une URL TCP vers un serveur distant
2. Le format est typique d'une backdoor qui établit une connexion sortante
3. Le port 29552 n'est pas un port standard, suggérant un C2 (Command & Control) personnalisé
{{< /section >}}

{{< section type="note" title="3. Confirmation de l'application compromise" icon="app" >}}

### Vérification de l'identifiant de l'application

Pour confirmer que l'application Signal est bien compromise, nous vérifions les logs système :

```bash
# Dans les fichiers de crash
grep -r "coalitionName" crashes_and_spins/ | grep signal

# Output:
# crashes_and_spins/Signal.hooked-2025-04-07-074158.ips:  "coalitionName" : "org.whispersystems.signal",
# crashes_and_spins/mussel-2025-04-07-075357.ips:  "coalitionName" : "org.whispersystems.signal",

# Dans les logs du système
grep -r "org.whispersystems.signal" RunningBoard/

# Output:
# RunningBoard/RunningBoard_state.log: application<org.whispersystems.signal>:344
# RunningBoard/RunningBoard_state.log: application<org.whispersystems.signal>:344
```

Les logs confirment que :
1. L'application Signal est bien compromise
2. Son identifiant est `org.whispersystems.signal`
3. Le processus `mussel` est associé à cette application
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
En combinant toutes les informations trouvées :
- Application compromise : org.whispersystems.signal
- PID de la backdoor : 279 (première instance)

{{< flag "FCSC{org.whispersystems.signal|279}" >}}
{{< /section >}}

{{< section type="info" title="Résumé" icon="list" >}}
1. Analyse des processus non-système pour identifier des comportements suspects
2. Découverte d'un processus `mussel` exécuté en tant que root dans Signal.app
3. Analyse de l'argument base64 révélant une connexion TCP distante
4. Confirmation de l'application compromise via les logs système
5. Identification du PID original de la backdoor (279)
{{< /section >}} 