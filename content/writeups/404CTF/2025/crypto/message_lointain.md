---
title: Message lointain
categories: Crypto
cat: "chal"
solved: true
date: 2025-05-11T00:00:00Z
draft: true
difficulty: "⭐"
description: "Deciphering an extraterrestrial message encoded with a simple modular exponentiation."
---

{{< section type="info" title="Énoncé" icon="info-circle" >}}
Un message vient d'être reçu de l'espace, je me demande ce qu'il peut bien vouloir dire...

Le script de chiffrement est fourni :

```python
charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}-!"
n = len(charset)

def encrypt(message):
    encrypted = []
    for char in message:
        if char in charset:
            x = charset.index(char)
            y = pow(2, x, n+1)
            encrypted.append(charset[y])
    return ''.join(encrypted)

print("ENCRYPTED FLAG : ", encrypt(FLAG))

# ENCRYPTED FLAG : 828x6Yvx2sOnzMM4nI2sQ
```

On nous donne le message chiffré `828x6Yvx2sOnzMM4nI2sQ`. L'objectif est de le déchiffrer pour obtenir le `FLAG`.
{{< /section >}}

{{< section type="note" title="1. Analyse du chiffrement" icon="search" >}}
Le script définit un ensemble de caractères `charset` de taille $n = 66$.

La fonction `encrypt` prend un message en entrée et, pour chaque caractère présent dans le `charset`, elle effectue les opérations suivantes :

1. Trouve l'indice $x$ du caractère dans le `charset`.
2. Calcule $y = 2^x \pmod{n+1}$. Avec $n=66$, cela devient $y = 2^x \pmod{67}$.
3. Utilise l'indice $y$ pour trouver le caractère chiffré dans le `charset`.

Le message chiffré est la concaténation de ces caractères résultants.

Pour déchiffrer, nous devons inverser ce processus. Pour un caractère chiffré avec l'indice $y$, nous devons trouver l'indice original $x$ tel que $2^x \equiv y \pmod{67}$. Ceci est le problème du **logarithme discret**.

Comme le module (67) est un petit nombre premier, nous pouvons résoudre ce problème en précalculant les puissances de 2 modulo 67.
{{< /section >}}

{{< section type="note" title="2. Déchiffrement par précalcul" icon="calculator" >}}
Pour inverser le chiffrement, nous allons créer une table de correspondance entre les indices chiffrés ($y$) et les indices originaux ($x$).

Pour chaque indice original possible $x$ (de 0 à 65, la taille du `charset`), nous calculons $y = 2^x \pmod{67}$. Nous stockons ensuite la paire $(y, x)$ dans notre table de déchiffrement.

Étant donné le message chiffré, nous parcourons chaque caractère :

1. Trouve l'indice $y$ du caractère chiffré dans le `charset`.
2. Utilise la table de déchiffrement pour trouver l'indice original $x$ correspondant à $y$.
3. Le caractère déchiffré est le caractère du `charset` à l'indice $x$.
{{< /section >}}

{{< section type="note" title="3. Script de déchiffrement" icon="code" >}}
Voici le script Python pour effectuer le déchiffrement :

```python
charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}-!"
n = len(charset)
mod = n + 1  # 67

# Créer la table de déchiffrement : y -> x
decryption_map = {}
for x in range(n):
    y = pow(2, x, mod)
    # Puisque 67 est premier et 2 est une racine primitive modulo 67,
    # chaque y aura un unique x correspondant dans la plage [0, 65].
    decryption_map[y] = x

def decrypt(encrypted_message):
    decrypted = []
    for char in encrypted_message:
        if char in charset:
            y = charset.index(char)
            # Rechercher l'indice original x dans la table
            if y in decryption_map:
                x = decryption_map[y]
                decrypted.append(charset[x])
            else:
                # Cas inattendu si le message vient bien du script d'origine
                decrypted.append('?')
        else:
            # Gérer les caractères non dans le charset si nécessaire
            decrypted.append(char)
    return ''.join(decrypted)

encrypted_flag = "828x6Yvx2sOnzMM4nI2sQ"
decrypted_flag = decrypt(encrypted_flag)
print("DECRYPTED FLAG : ", decrypted_flag)
```

Ce script calcule d'abord le mapping inverse de l'opération de chiffrement. Ensuite, il itère sur le message chiffré, trouve l'indice de chaque caractère chiffré dans le `charset`, utilise la table de déchiffrement pour trouver l'indice original, et reconstitue le message déchiffré.
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
En exécutant le script de déchiffrement avec le message chiffré, nous obtenons le flag :

```
DECRYPTED FLAG :  404CTF{C0nstEllAt!0n}
```

{{< flag "404CTF{C0nstEllAt!0n}" >}}
{{< /section >}}

{{< section type="info" title="Résumé des étapes" icon="table" >}}
1. **Analyse du chiffrement** : Comprendre que le chiffrement utilise $y = 2^x \pmod{67}$.
2. **Problème inverse** : Reconnaître qu'il s'agit d'un problème de logarithme discret.
3. **Précalcul** : Créer une table de correspondance des indices chiffrés aux indices originaux en calculant $2^x \pmod{67}$ pour tous les $x$ possibles.
4. **Déchiffrement** : Utiliser la table pour remplacer chaque caractère chiffré par son caractère original.
{{< /section >}}