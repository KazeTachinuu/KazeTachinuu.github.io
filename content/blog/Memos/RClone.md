---
title: "How to properly mount Google Drive with RClone"
date: 2023-01-01T19:49:32-05:00
description: "Mount Google Drive with security and cache"
draft: false
---

## Install RClone

Before we start, you need to install RClone on your computer. 

For arch, run
```bash
sudo pacman -S rclone
```

## Set up Google Drive Remote

We need to link RClone with your Google account. Run the following command to start the configuration:

```bash
rclone config
```

Press n to create a new remote.

```bash
Enter name for new remote.
name> TEST

Option Storage.
Type of storage to configure.
Choose a number from below, or type in your own value.
 1 / 1Fichier
   \ (fichier)
 2 / Akamai NetStorage
   \ (netstorage)
...
17 / Google Cloud Storage (this is not Google Drive)
   \ (google cloud storage)
18 / Google Drive
   \ (drive)
19 / Google Photos
   \ (google photos)
...
49 / premiumize.me
   \ (premiumizeme)
50 / seafile
   \ (seafile)
Storage> drive
```

Enter a name for the new remote and then select Google Drive for Storage.

Follow the <a href="https://rclone.org/drive/#making-your-own-client-id">tutorial</a> provided by RClone to create a Google Application Client ID. Copy and paste the client ID and the client secret.

Select full access for RClone:

```bash
Scope that rclone should use when requesting access from drive.
Choose a number from below, or type in your own value.
Press Enter to leave empty.
 1 / Full access all files, excluding Application Data Folder.
   \ (drive)
 2 / Read-only access to file metadata and file contents.
   \ (drive.readonly)
   / Access to files created by rclone only.
 3 | These are visible in the drive website.
   | File authorization is revoked when the user deauthorizes the app.
   \ (drive.file)
   / Allows read and write access to the Application Data folder.
 4 | This is not visible in the drive website.
   \ (drive.appfolder)
   / Allows read-only access to file metadata but
 5 | does not allow any access to read or download file content.
   \ (drive.metadata.readonly)
scope> 1
```

Then go with the default setting in the following steps (Just press ENTER).

## Encrypt Google Drive Contents

Start the configuration again by `rclone config`, and create another remote with a different name. Choose crypt for type:

```bash
Enter name for new remote.
name> TEST_ENCRYPTED

Option Storage.
Type of storage to configure.
Choose a number from below, or type in your own value.
 1 / 1Fichier
   \ (fichier)
 2 / Akamai NetStorage
   \ (netstorage)
 3 / Alias for an existing remote
   \ (alias)
...
13 / Dropbox
   \ (dropbox)
14 / Encrypt/Decrypt a remote
   \ (crypt)
15 / Enterprise File Fabric
   \ (filefabric)
...
49 / premiumize.me
   \ (premiumizeme)
50 / seafile
   \ (seafile)
Storage> crypt
```

Enter a path where you want to store the encrypted files. For example,

```bash
Option remote.
Remote to encrypt/decrypt.
Normally should contain a ':' and a path, e.g. "myremote:path/to/dir",
"myremote:bucket" or maybe "myremote:" (not recommended).
Enter a value.
remote> TEST:encrypted
```

You may replace the `TEST` with the name of the remote that you just created.

Ask the system to encrypt both filenames and directory names for safety:

```bash
Option filename_encryption.
How to encrypt the filenames.
Choose a number from below, or type in your own string value.
Press Enter for the default (standard).
   / Encrypt the filenames.
 1 | See the docs for the details.
   \ (standard)
 2 / Very simple filename obfuscation.
   \ (obfuscate)
   / Don\'t encrypt the file names.
 3 | Adds a ".bin" extension only.
   \ (off)
filename_encryption> 1

Option directory_name_encryption.
Option to either encrypt directory names or leave them intact.
NB If filename_encryption is "off" then this option will do nothing.
Choose a number from below, or type in your own boolean value (true or false).
Press Enter for the default (true).
 1 / Encrypt directory names.
   \ (true)
 2 / Don\'t encrypt directory names, leave them intact.
   \ (false)
directory_name_encryption> 1
```

Generate a secure random password and store it somewhere secure:
```bash
Option password.
Password or pass phrase for encryption.
Choose an alternative below.
y) Yes, type in my own password
g) Generate random password
y/g> g
Password strength in bits.
64 is just about memorable
128 is secure
1024 is the maximum
Bits> 1024
Your password is: bkXMPG0rVMRQNInuxRpixHBT0kV-pCTAXCb1mZVwSQQ_zYiv2Upu6er8qS00ifQd3MJIGmfZPBhhYlV8mqylCZOwPhvo_UVL_tZBx7HuHU65og4lu-MISvjaal7F95CsxWIW1K9nGfK2B-vE-0PMi93y_HPnjtf2q5wX7-iGPRs
Use this password? Please note that an obscured version of this
password (and not the password itself) will be stored under your
configuration file, so keep this generated password in a safe place.
y) Yes (default)
n) No
y/n> y

Option password2.
Password or pass phrase for salt.
Optional but recommended.
Should be different to the previous password.
Choose an alternative below. Press Enter for the default (n).
y) Yes, type in my own password
g) Generate random password
n) No, leave this optional password blank (default)
y/g/n> n
```

Then go with the default setting in the following steps (Just press ENTER).

## Mount the remote onto your system

Whenever you want to mount the Google Drive onto your system, you can run:

```bash
rclone mount TEST_ENCRYPTED: {THE PATH YOU WANT TO MOUNT ON} --vfs-cache-mode full --allow-non-empty
```

You may replace the `TEST_ENCRYPTED` with the name of the crypt remote that you just created. You can run this command when your system starts.
