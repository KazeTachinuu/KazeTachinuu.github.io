---
title: "PW Crack 3"
cat: "chal"
solved: true
points: 100
solves: 33230
date: 2024-05-12T00:00:00Z
draft: false
---

### PW Crack 3

**Category:** General Skills - **Points:** 100 - **Solves:** 33230  
**Description:**  
Can you crack the password to get the flag? Download the password checker here and you'll need the encrypted flag and the hash in the same directory too. There are 7 potential passwords with 1 being correct. You can find these by examining the password checker script.

**Solution:**  
This challenge is here to introduce us to hashing, while with the two previous one we could get the password by looking at the password checking code directly, this one is using MD5 which hash the password. Thankfully in the source code we are provided with a list of password :

```python
# The strings below are 7 possibilities for the correct password.
#   (Only 1 is correct)
pos_pw_list = ["6997", "3ac8", "f0ac", "4b17", "ec27", "4e66", "865e"]
```

As we are told that one of the 7 password is correct, we should simply write a simple function that test all of them until it finds the corresponding hash:

```python
pos_pw_list = ["6997", "3ac8", "f0ac", "4b17", "ec27", "4e66", "865e"]

i = 0
n = len(pos_pw_list)

print("Trying to match each password with provided hash")
hashed_pw = hash_pw(pos_pw_list[i])
while i < n and hashed_pw != correct_pw_hash:
    print(f"{i+1}/{n} - {pos_pw_list[i]} {hashed_pw} != {correct_pw_hash}")
    i += 1
    hashed_pw = hash_pw(pos_pw_list[i])


if i < n:
    print("Password Matching Hash found ! : " + pos_pw_list[i])
    decryption = str_xor(flag_enc.decode(), pos_pw_list[i])
    print(decryption)

else:
    print("No password in the list matched the hash")
```

Then we run it to match all password :

```sh
>>> python solve.py
Trying to match each password with provided hash
1/7 - 6997 b'\xc9\x04\x9d*F\xfe\xb0\xae-\xe6\xb0co2\xea\r' != b'\x1b\x18\xe11o\x92\x18\xcc[\x05>\x1c\xea(\xe0.'
2/7 - 3ac8 b"\x96H\xae#K\xd3'\xd6\x86\xf9\xd6\x844 p\xcd" != b'\x1b\x18\xe11o\x92\x18\xcc[\x05>\x1c\xea(\xe0.'
3/7 - f0ac b'\xeewQ\xa0]\xea\xd0\x1a67\x87)\xfd\x0c N' != b'\x1b\x18\xe11o\x92\x18\xcc[\x05>\x1c\xea(\xe0.'
4/7 - 4b17 b'\x03\x07\x81y\xea>\x83\x07V \xb5\xed\x18\xf9X\x94' != b'\x1b\x18\xe11o\x92\x18\xcc[\x05>\x1c\xea(\xe0.'
5/7 - ec27 b'\xf4\x17\x198\x89\x02\xe5\x1c\x11\x1aWx\xb4f\x9f\xcb' != b'\x1b\x18\xe11o\x92\x18\xcc[\x05>\x1c\xea(\xe0.'
6/7 - 4e66 b'\xcdi%\xa9\xd52E\xb1\x06\xa9~0?^.\xf7' != b'\x1b\x18\xe11o\x92\x18\xcc[\x05>\x1c\xea(\xe0.'
Password Matching Hash found ! : 865e
picoCTF{m45h_fl1ng1ng_2b072a90}
```

We got the flag :)

{{< flag "picoCTF{m45h_fl1ng1ng_2b072a90}" >}}
