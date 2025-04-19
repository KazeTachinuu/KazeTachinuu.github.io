---
title: "Alice's Music Collection (MPD)"
categories: "Misc"
cat: "chal"
solved: true
date: 2025-04-18T00:00:00Z 
draft: false
description: "Identify a song using audio fingerprinting from a misconfigured MPD server."
---

{{< section type="info" title="Challenge Summary" icon="info-circle" >}}
Alice exposes her music collection via a misconfigured MPD (Music Player Daemon) server. She claims you cannot find the real name of the song behind `flag.opus`, as she renamed all her files.

The flag format is: `FCSC{Artist_Title}` (not case sensitive, spaces allowed)
{{< /section >}}

{{< section type="note" title="Reconnaissance" icon="search" >}}
Connect to the server using netcat:
```bash
nc chall.fcsc.fr 2052
```
List all files and their metadata:
```mpd
listallinfo
```
Key findings:
- `flag.opus` has no artist/title metadata.
- Duration: **86.726 seconds** (1:26.726)
- Format: stereo, 48kHz, 16 bits
{{< /section >}}

{{< section type="note" title="Exploration & Fingerprinting" icon="lightbulb" >}}
Playback and download commands are disabled. However, the server supports advanced MPD commands, including `getfingerprint` and `readcomments`.

Run `getfingerprint`:
```mpd
getfingerprint flag.opus
```
This returns a long **chromaprint fingerprint** string.
{{< /section >}}

{{< section type="note" title="Song Identification via AcoustID" icon="cogs" >}}
AcoustID is a public database mapping audio fingerprints to song metadata. We query its API using the obtained fingerprint and duration.

```bash
# Replace PASTE_YOUR_FINGERPRINT_HERE with the actual fingerprint
curl -G "https://api.acoustid.org/v2/lookup" \
  --data-urlencode "client=xJE5nUnp1Ak" \
  --data-urlencode "duration=87" \
  --data-urlencode "fingerprint=PASTE_YOUR_FINGERPRINT_HERE" \
  --data-urlencode "meta=recordings+releasegroups+compress"
```
The API response leads to an AcoustID track ID. Visiting the AcoustID track page ([https://acoustid.org/track/da787869-dc08-476f-806e-464bf182aa5f](https://acoustid.org/track/da787869-dc08-476f-806e-464bf182aa5f)) reveals the song details:

| Title   | Artist      | Length |
|---------|-------------|--------|
| Wiosna  | Aya Higuchi | 1:26   |
{{< /section >}}

{{< section type="success" title="Flag Construction" icon="flag" >}}
Following the format `FCSC{Artist_Title}`, the flag is:
{{< flag "FCSC{Aya Higuchi_Wiosna}" >}}
{{< /section >}}

{{< section type="info" title="Summary of Steps" icon="list-ol" >}}
1. Connect to the MPD server (`nc`) and list files (`listallinfo`).
2. Use `getfingerprint` to extract the Chromaprint fingerprint of `flag.opus`.
3. Query the AcoustID API with the fingerprint and duration (`curl`).
4. Identify the song title ("Wiosna") and artist ("Aya Higuchi") from the AcoustID result.
5. Format the flag as `FCSC{Aya Higuchi_Wiosna}`.
{{< /section >}} 