---
title: Signal sur chat 
categories: Hardware
cat: "chal"
difficulty: "⭐⭐⭐"
points: "250"
solved: true
date: 2025-04-19T00:00:00Z
draft: false
description: "Décodage de signaux DSSS avec codes de Gold dans un fichier audio contenant du bruit de chat."
filedir: FCSC/2025/hardware/chat
---

{{< section type="info" title="Description du challenge" icon="info-circle" >}}
Les techniques d'étalement de spectre à séquence directe (DSSS) sont formidables. Elles permettent à plusieurs systèmes radio de communiquer en même temps sur le même canal (CDMA : Code Division Multiple Access), et peuvent résister à des rapports signal à bruit très défavorables.

Dans ce challenge, nous devons retrouver un flag de 22 caractères qui a été transmis simultanément, avec du bruit de chat ajouté. Le rapport signal sur bruit peut atteindre jusqu'à $-45$ dB !

Les codes de Gold utilisés sont formés à partir de deux LFSR (Linear Feedback Shift Register) de longueur 15 bits, avec les polynômes générateurs :
- $G_1(x) = x^{15} + x^7 + 1$
- $G_2(x) = x^{15} + x^{10} + x^5 + x^4 + 1$

Les valeurs d'initialisation des deux registres sont `0x7FFF`.
{{< /section >}}

{{< section type="note" title="1. Analyse du signal" icon="waveform" >}}

### Structure du signal

Le fichier audio fourni (`signal-sur-chat.wav`) contient :
- $262\,136$ échantillons ($8 \times 32\,767$, où $32\,767 = 2^{15} - 1$)
- Format : WAV mono 16 bits à 44.1 kHz
- Les 22 caractères du flag sont superposés, chacun avec son propre code de Gold
- Chaque bit est transmis avec un échantillon par bit de séquence de Gold

### Phases des codes de Gold

Les 22 phases (décalages du registre $G_2$ par rapport à $G_1$) sont :
```python
phases = [4, 7, 8, 24, 27, 31, 39, 42, 43, 49, 53, 54, 
          59, 62, 65, 73, 93, 99, 118, 119, 120, 128]
```

### Modulation utilisée

- Les bits sont transmis en BPSK (Binary Phase Shift Keying)
- $1 \rightarrow +0.5$
- $0 \rightarrow -0.5$
{{< /section >}}

{{< section type="note" title="2. Solution" icon="code" >}}

### Implémentation Python

```python
import numpy as np
from scipy.io import wavfile
import warnings

def gen_mseq(feedback_taps, init_state, L=2**15-1):
    """Génère une m-séquence de période L via LFSR d'ordre 15."""
    state = init_state.copy()
    seq = np.empty(L, dtype=np.int8)
    for i in range(L):
        seq[i] = state[-1]
        fb = 0
        for t in feedback_taps:
            fb ^= state[t]
        state = [fb] + state[:-1]
    return seq

# Paramètres
L = 2**15 - 1
taps_G1 = [14, 6]        # pour x^15 + x^7 + 1
taps_G2 = [14, 9, 4, 3]  # pour x^15 + x^10 + x^5 + x^4 + 1
init    = [1]*15         # état 0x7FFF

# Génération G1, G2
g1 = gen_mseq(taps_G1, init, L)
g2 = gen_mseq(taps_G2, init, L)

# Phases données
phases = [4,7,8,24,27,31,39,42,43,49,53,54,
          59,62,65,73,93,99,118,119,120,128]

# Construction des 22 Gold codes (+0.5 / -0.5)
codes = []
for phi in phases:
    g2s  = np.roll(g2, -phi)
    gold = g1 ^ g2s
    codes.append(gold.astype(np.float32) - 0.5)

# Lecture du signal
warnings.filterwarnings("ignore", category=wavfile.WavFileWarning)
sr, sig = wavfile.read("signal-sur-chat.wav")
assert sig.shape[0] == 8 * L, (
    f"Attendu {8*L} échantillons, trouvé {sig.shape[0]}"
)
if sig.dtype != np.float32:
    sig = sig.astype(np.float32) / np.max(np.abs(sig))

# Décodage bit à bit
flag_chars = []
for code in codes:
    bits = []
    for b in range(8):
        seg  = sig[b*L:(b+1)*L]
        corr = np.dot(seg, code)
        bits.append(0 if corr > 0 else 1)
    val = sum(bits[k] << (7-k) for k in range(8))
    flag_chars.append(chr(val))

flag = "".join(flag_chars)
print("Flag ASCII :", flag)
```
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
En exécutant le script, nous obtenons :

{{< flag "FCSC{3CBB574DABA4D95C}" >}}
{{< /section >}}

{{< section type="info" title="Explications" icon="lightbulb" >}}
1. **Génération des m-séquences** :
   - Deux LFSR de longueur 15 bits génèrent des séquences pseudo-aléatoires
   - Les polynômes $G_1$ et $G_2$ définissent les retours de feedback
   - L'état initial $0x7FFF$ (15 bits à 1) est utilisé pour les deux registres

2. **Construction des codes de Gold** :
   - Pour chaque phase $\phi$, on décale $G_2$ et on fait le XOR avec $G_1$
   - Les bits sont mappés en $+0.5/-0.5$ pour la modulation BPSK

3. **Décodage** :
   - Le signal est divisé en 8 segments (un par bit)
   - Pour chaque code de Gold, on calcule la corrélation avec chaque segment
   - Un résultat positif indique un bit 0, négatif un bit 1
   - Les bits sont recombinés en octets pour former les caractères ASCII

Le gain de traitement de $45.2$ dB ($10\log_{10}(32767)$) permet de retrouver le signal malgré le bruit de chat !
{{< /section >}} 