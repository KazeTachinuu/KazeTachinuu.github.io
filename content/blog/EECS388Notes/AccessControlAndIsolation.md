---
title: "Access Control And Isolation"
date: 2022-11-03T12:13:38-04:00
description: "How to construct a system with access control"
draft: false
---

## Access Control

We aim for: Principle of Least Privilege. 
- Limit the damage of an accident
- Reduce interaction to the minimum operator
- Minimized the number of the program audited.

( e.g: My office key can only open my office door. )

( e.g: Classified information of "need-to-know" )

### Models and Policies

**Security Model**

- **Subject** (Who);
    Apps, Users, Web Origins
- **Objects** (What):
    Files, Processes, Devices, DB Tables, Cookies
- **Operations**:
    Read, Write, Call

This security model defines an **Access Control Matrix**. 

### Implementing Access Control

**Principle of Complete Mediation**: Every access must be checked for authority by a mediator.

- The primary underpinning of access control protection systems.
- Implies that the source of the request must be identified.
- Be careful with Access Control Caching.

### Unix System

- Subject: Users
- Object: Files, Directories, Processes
- Access Operation: Read, Write, Execute

Superuser (id : 0) has authority to do anything. Users in specific group can temporarily elevate to root privileges.

**Files**
`ls -l` displays the access control permission info. {Owner Permission} {Group Permission} {Others Permission} (All of them are RWX)

Note: X on a directory specifies whether you can list the content of the directory.

```
if user == owner:
    owner permission
else if user in group:
    group permission
else
    others permission
```

**Processes**
Every process in Unix has an **Effective User ID** (EUID). It inherit the user and group of their parent processes but can be changed by root.

`login` and `sshd` run as root and then change the user id and group id to that of the user and execute the shell.

Executable files have a setuid bit. If set, the process has EUID of the file's owner, rather than the user that executed it. ( `passwd` always runs as `root` )

**Danger: Any vulnerability in `passwd` mean the attacker gets root.**

## Process Isolation

Be Skeptical of all programs and isolate to achieve the least privilege.


**Confinement**: 

- System call interpolation (AppArmor, SELinux)
- Containers: Dockers, Kubernetes
- Virtual Machines: Isolation OSes
- Physical Isolation: Separate Machines

**Chroot Jails**:
```sh
su
chroot /tmp/guest
su guest
./myapp
```
Now `open("/etc/passwd")` only opens `/tmp/guest/etc/passwd`

Ways to evade chroot Isolation
- Create a device that lets you access the raw disk
- Send signals to non-chrooted processes
- Reboot system
- Bind to privileged ports

**System Call Interposition**:

Idea: Monitor an app's system calls and block unauthorized calls.

Unix **PTRACE**: `ptrace(..., pid, ..)` in the monitor application. When the pid makes a system call, kernel is going to call back the monitor.

**Note**: It is hard to choose (generate) policies for all applications.

**Containers**: Separate userspaces

**Virtual Machines**: Simulate a complete physical machine. Virtual Machine is monitored by VMM (virtual machine monitor). Hypervisor: Specialized OS that hosts operating systems.

