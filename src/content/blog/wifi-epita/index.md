---
title: "Wifi IONIS setup"
description: "Connect to IONIS Wifi on Linux"
date: 2025-09-08T11:14:36-04:00
categories: ["notes"]
tags: ["wifi", "epita", "enterprise-wifi", "linux", "networking"]
---


IONIS Wifi uses WPA2-Enterprise with PEAP + MSCHAPv2.  
Credentials: `first.name@epita.fr` / CRI password.  
Official doc: [docs.forge.epita.fr](https://docs.forge.epita.fr/epita/environment/from-school/wifi)

---

## iwd (Omarchy)

Create `/var/lib/iwd/IONIS.8021x`:

```bash
[Security]
EAP-Method=PEAP
EAP-Identity=<first.name@epita.fr>
EAP-PEAP-Phase2-Method=MSCHAPV2
EAP-PEAP-Phase2-Identity=<first.name@epita.fr>
EAP-PEAP-Phase2-Password=<password-cri>

[Settings]
Autoconnect=true
```

Then:
```bash
sudo systemctl restart iwd
iwctl station wlan0 connect IONIS
```

---

## NetworkManager (GUI) -- Ubuntu's Default

* SSID: **IONIS**
* Security: WPA2 Enterprise
* EAP method: **PEAP**
* Phase 2: **MSCHAPv2**
* Identity: `<first.name@epita.fr>`
* Password: `<password-cri>`
* CA cert: *none*

---

## NetworkManager (CLI)

```bash
nmcli connection add type wifi con-name IONIS ifname wlan0 ssid IONIS \
  wifi-sec.key-mgmt wpa-eap 802-1x.eap peap 802-1x.phase2-auth mschapv2 \
  802-1x.identity "first.name@epita.fr" 802-1x.password "password-cri"
```

---

## netctl (Arch)

`/etc/netctl/wlan0-IONIS`:

```bash
Description='IONIS Wifi'
Interface=wlan0
Connection=wireless
Security=wpa-configsection
IP=dhcp
WPAConfigSection=(
  'ssid="IONIS"'
  'key_mgmt=WPA-EAP'
  'eap=PEAP'
  'identity="first.name@epita.fr"'
  'password="password-cri"'
  'phase2="auth=MSCHAPV2"'
)
```

Enable with:

```bash
sudo netctl enable wlan0-IONIS
sudo netctl start wlan0-IONIS
```
