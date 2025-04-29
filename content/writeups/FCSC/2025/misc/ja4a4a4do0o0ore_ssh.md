---
title: "ja4a4a4do0o0ore SSH!"
categories: "Misc"
cat: "chal"
solved: true
date: 2025-04-18T00:00:00Z 
draft: false
difficulty: "⭐"
description: "Identifier la session SSH interactive d'un attaquant et extraire les cookies SSH d'une capture réseau."
---

{{< section type="info" title="Énoncé résumé" icon="info-circle" >}}
Un attaquant a pris le contrôle d'un mot de passe SSH et s'est connecté de façon interactive à un serveur.
On nous donne une capture réseau (`.pcap`) contenant de nombreuses connexions SSH automatisées et une seule connexion interactive de l'attaquant.
Le flag est composé des **cookies SSH** de la session de l'attaquant, au format :
`FCSC{cookie_client-cookie_server}`
{{< /section >}}

{{< section type="note" title="Étapes de résolution" icon="list-ol" >}}

**1. Lister les flux SSH**

On commence par lister tous les flux TCP sur le port 2222 (SSH) pour repérer les connexions suspectes :
```bash
tshark -r ja4a4a4do0o0re-ssh.pcap -q -z conv,tcp
```

**2. Repérer la session interactive**

On cherche un flux avec :
- **Beaucoup de paquets** mais **peu de données** (typiquement une session interactive humaine, pas un script).
- Exemple trouvé :
  `172.28.1.23:49302 <-> 172.28.1.5:2222`
  (452 paquets dans un sens, 780 dans l'autre, mais seulement 147 kB échangés).

**3. Trouver le numéro de flux**

On identifie le numéro de flux TCP correspondant :
```bash
tshark -r ja4a4a4do0o0re-ssh.pcap -Y "ip.src==172.28.1.23 && ip.dst==172.28.1.5 && tcp.srcport==49302 && tcp.dstport==2222" -T fields -e tcp.stream
```
Résultat : **100**

**4. Extraire les cookies SSH**

On force tshark à décoder le port 2222 comme SSH et on extrait les cookies du flux 100 :
```bash
tshark -r ja4a4a4do0o0re-ssh.pcap -d tcp.port==2222,ssh -Y "tcp.stream==100 && ssh" -V | grep -i cookie
```
On obtient :
```
Cookie: f24e0ff9dc4c1c005d5f3aaac4853575
Cookie: 90c7d30853db0f93bc8dad28c7b62b4d
```

**5. Assembler le flag**

Le premier cookie (client) est celui envoyé par l'IP source de l'attaquant (`172.28.1.23`), le second (serveur) par le serveur (`172.28.1.5`).
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
{{< flag "FCSC{f24e0ff9dc4c1c005d5f3aaac4853575-90c7d30853db0f93bc8dad28c7b62b4d}" >}}
{{< /section >}}

{{< section type="info" title="Résumé" icon="clipboard-check" >}}
- On a identifié la session interactive de l'attaquant grâce à son comportement réseau.
- On a extrait les cookies SSH du handshake de cette session.
- On a assemblé le flag au format demandé.
{{< /section >}}

{{< section type="tools" title="Outils utilisés" icon="tools" >}}
- tshark (Wireshark en ligne de commande)
{{< /section >}} 