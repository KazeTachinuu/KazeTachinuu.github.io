+++
categories = ["all"]
date = 2023-10-28T00:00:00Z
title = "Stage 06"
type = "post"
draft = false
+++


## Final Stage

```bash
$ validate part55 Anal-Liste
Heyy, I'm very impressed with your skills!
I feel like we are going to make a great team together.

Come on, let's go to the two finals, and then you get the reward.

A friend told me that there was access to the file system of this terminal.
It would be interesting to take a look at it. We could probably become root?
I'm not sure where to look? I just know it's via an admin access, and then in a sub-part called filer.
```

Based on the given clues referencing the file system, **`admin`** access, and a sub-part called **`filer`**, I deduced that accessing a specific file system on the website was necessary. After some trial and error, I successfully identified the correct URL: **`https://ctf.unit41.fr/admin/filer`**.

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%2012.png)

Upon exploring the directories, 'root/' contained a file named **`.bash_history`** that revealed a sequence of commands. Notable entries included accessing various files, installing packages, and attempting to brute force a file named **`flag.enc`**

```bash
nano /www/locale/DoNotErase.txt
cat INSTALL
cat README
./autogen.sh
ls
cat autogen.sh
apt-get install autoreconf
apt-get install autotools-dev
./autogen.sh
apt-cache search autoreconf
apt-get install dh-autoreconf
./autogen.sh
./configure
apt install libssl1.0-dev
apt-cache search libssl
apt install libssl-dev
./configure
make
ls -lah
make install
cd ..
ls -lah
bruteforce-salted-openssl -t 4 -l 5 -m 5 -c aes256 flag.enc
bruteforce-salted-openssl -t 4 -l 5 -m 5 -n -c aes256 flag.enc
bruteforce-salted-openssl -t 4 -l 5 -m 5 -n -v 5 -c aes256 flag.enc
wget https://apasscracker.com/dictionaries/common-passwords.zip
unzip common-passwords.zip
ls
cat common-passwords.
cat common-passwords.txt
bruteforce-salted-openssl -t 6 -f dictionary.txt -n -v 5 -c aes256 flag.enc
bruteforce-salted-openssl -t 6 -f common-passwords.txt -n -v 5 -c aes256 flag.enc
wget https://apasscracker.com/dictionaries/1mm.zip
nano /etc/services/WEBACCESS.php
cd ..
ls
cd ro
cd var
ls
cd ..
ls -lah
cd overlay/
ls
cd ..
cd bin/
ls
ls -lah
cd ..
cd etc/
ls
ls -lah
cat uci-defaults
cd uci-defaults/
ls
cat 50_luci-mod-admin-full
cat 13_fix_group_user
cat ../../usr/lib/opkg/info/*.control
cd ..
cd ..
grep -R "ATR" .
grep -R ATR .
grep -R admin .
grep -R password .
cd ./root/
ls
ls -lah
cd .secret/
```

Of particular interest was **`/www/locale/DoNotErase.txt`**, which contained a reminder of the login password for a portal: **`HaX0R2021!`**. However, the exact portal URL was still unknown.

```text
Just to remember my password to login to the portal is : HaX0R2021!
But dont remember where is this portal URL... maybe somewhere on my server...
```

Further examination of the bash history led to a command accessing **`/etc/services/WEBACCESS.php`**. Inside, a complex PHP script was discovered, hinting at a web access portal.

```php
0) $tmp_pass = cut($password, 0, "\\"); else $tmp_pass = ""; while($count_tmp < $bslashcount) { $tmp_str = cut($password, $count_tmp, "\\"); $tmp_pass = $tmp_pass ."\\\\".$tmp_str; $count_tmp = $count_tmp + 1; } if($bslashcount > 0) $password = $tmp_pass; $commacount = cut_count($password, ","); $count_tmp = 1; if($bslashcount > 0) $tmp_pass = cut($password, 0, ","); else $tmp_pass = ""; while($count_tmp < $commacount) { $tmp_str = cut($password, $count_tmp, ","); $tmp_pass = $tmp_pass ."\\,".$tmp_str; $count_tmp = $count_tmp + 1; } if($commacount > 0) return $tmp_pass; else return $password; //end } function setup_wfa_account() { $ACCOUNT = "/var/run/storage_account_root"; /*for the admin is s

....... [rest of the code]
```

Adjacent to this file was a backup: **`/etc/services/WEBACCESS.php.bak`**.

```php
<?
/*
TODO : continue to dev the webaccess portal here :
recruit
unit41
fr
/admin/portal/

login : folks

But i dont remember my password...
*/

....... [rest of the code] 
```

This file provided clearer information, revealing the portal URL **`/admin/portal/`** and login credentials: **`folks`** / **`HaX0R2021!`**.

we got a login for our portal and also we got the link !

Navigating to the **`/admin/portal/`** URL, a login interface prompted for credentials.

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%2013.png)

Using the previously obtained credentials, **`folks`** as the username and **`HaX0R2021!`** as the password, I successfully accessed the portal.

```text
FINNISHED !! Very impressive !

Please type the validate command : validate end99 WelcomeAboard
```

![Untitled](/writeups/OrangeCTF-2023/Files/Untitled%2014.png)

We are now done with the ctf, CONGRATS !