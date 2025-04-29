---
title: "Le calme avant la tempest"
categories: Hardware
cat: "chal"
difficulty: "⭐"
solved: true
date: 2025-04-19T00:00:00Z
draft: false
description: "Reconstruction d'un signal vidéo PAL composite à partir d'un flux échantillonné à 20 MHz"
filedir: FCSC/2025/hardware/tempest
---

{{< section type="info" title="Description du challenge" icon="info-circle" >}}
Nous devons reconstruire un signal vidéo PAL composite à partir d'un fichier binaire contenant un flux échantillonné à 20 MHz. Le signal contient une image avec le flag.

Le standard PAL (Phase Alternating Line) est un standard de télévision analogique avec les caractéristiques suivantes :
- Fréquence d'échantillonnage : 20 MHz
- Durée d'une ligne : 64 µs
- Durée de la synchronisation : 4.7 µs
- Durée du back porch : 5.7 µs
- Durée de la vidéo active : 52 µs
- Durée du front porch : 1.65 µs
- Nombre de lignes par trame : 625
{{< /section >}}

{{< section type="note" title="1. Analyse du signal" icon="waveform" >}}

### Structure du signal PAL

Le fichier binaire contient :
- Des échantillons signés 16 bits
- Échantillonnage à 20 MHz
- Une trame PAL complète (625 lignes)
- Chaque ligne contient :
  - Un pulse de synchronisation
  - Un back porch
  - La vidéo active
  - Un front porch

### Paramètres d'échantillonnage

```python
fs = 20e6
sync_samps   = int(4.7e-6  * fs)  # ≃94
back_porch   = int(5.7e-6  * fs)  # ≃114
active_samps = int(52e-6   * fs)  # ≃1040
fporch       = int(1.65e-6 * fs)  # ≃33
line_samps   = sync_samps + back_porch + active_samps + fporch  # ≃1280
```
{{< /section >}}

{{< section type="note" title="2. Solution" icon="code" >}}

### Implémentation Python

```python
import numpy as np
import matplotlib.pyplot as plt

# 1) PAL @20 MHz sampling parameters
fs = 20e6
sync_samps   = int(4.7e-6  * fs)  # ≃94
back_porch   = int(5.7e-6  * fs)  # ≃114
active_samps = int(52e-6   * fs)  # ≃1040
fporch       = int(1.65e-6 * fs)  # ≃33
line_samps   = sync_samps + back_porch + active_samps + fporch  # ≃1280

# 2) Load raw 16‑bit signed waveform
data = np.fromfile("le-calme-avant-la-tempest.bin", dtype=np.int16)

# 3) Pick a low‑level threshold (1st percentile) for sync detection
thr = np.percentile(data, 1)

# 4) Find falling edges into sync
edges = np.where((data[:-1] > thr) & (data[1:] <= thr))[0]

# 5) Enforce one edge per line
lines = []
last = -line_samps
for e in edges:
    if e - last > line_samps * 0.8:
        lines.append(e)
        last = e

# 6) Extract each active scan‑line (skip sync + back‑porch)
vid_lines = []
for e in lines:
    start = e + sync_samps + back_porch
    end   = start + active_samps
    if end <= data.size:
        vid_lines.append(data[start:end])

# stack into a 2D array
vid = np.vstack(vid_lines)

# 7) Take exactly one PAL frame (625 lines)
LINES_PER_FRAME = 625
frame = vid[:LINES_PER_FRAME, :]

# 8) Normalize to [0,255] and save
mn = frame.min()
pt = np.ptp(frame)           # use np.ptp() instead of frame.ptp()
img = (frame - mn) / pt * 255
img8 = img.astype(np.uint8)

plt.imsave("frame.png", img8, cmap="gray")
print("Done → open frame.png to read the flag!")
```
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
En ouvrant l'image `frame.png`, nous pouvons lire le flag :
{{< flag "FLAG{T3MP3ST_F0R3V3R}" >}}
{{< /section >}}

{{< figure src="/images/writeups/fcsc/2025/hardware/tempest/frame.png" alt="Flag" >}}



{{< section type="info" title="Explications" icon="lightbulb" >}}
1. **Paramètres PAL** :
   - Les durées des différentes parties d'une ligne sont converties en nombre d'échantillons
   - La durée totale d'une ligne est de 1280 échantillons à 20 MHz

2. **Détection des lignes** :
   - Utilisation du 1er percentile comme seuil pour détecter les pulses de synchronisation
   - Détection des fronts descendants pour identifier le début de chaque ligne
   - Filtrage pour ne garder qu'un front par ligne

3. **Extraction de la vidéo** :
   - Pour chaque ligne, on saute la synchronisation et le back porch
   - On extrait les 1040 échantillons de vidéo active
   - Les lignes sont empilées pour former une image 2D

4. **Normalisation** :
   - L'image est normalisée sur l'intervalle [0,255]
   - Utilisation de `np.ptp()` pour calculer l'étendue des valeurs
   - Conversion en entier non signé 8 bits pour l'image finale

{{< /section >}} 