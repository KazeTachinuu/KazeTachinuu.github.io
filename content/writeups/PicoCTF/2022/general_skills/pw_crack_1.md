---
title: "PW Crack 1"
cat: "chal"
solved: true
points: 100
solves: 41103
date: 2024-05-12T00:00:00Z
draft: false
---

### PW Crack 1   
**Category:** General Skills - **Points:** 100 - **Solves:** 41103   
**Description:**   
Can you crack the password to get the flag? Download the password checker here and you'll need the encrypted flag in the same directory too.   

**Solution:**  

Here we are tasked to decrypt a flag using a python script, it seems that when we run it, it's asking for a password: 

```sh
>>> python level1.py
Please enter correct password for flag: test
That password is incorrect
```

Let's look at the source code : 

```python
def level_1_pw_check():
    user_pw = input("Please enter correct password for flag: ")
    if( user_pw == "691d"):
        print("Welcome back... your flag, user:")
        decryption = str_xor(flag_enc.decode(), user_pw)
        print(decryption)
        return
    print("That password is incorrect")
```

Ah it seems that the script is checking for the password `691d`. Let's try with it.

```sh
>>> python level1.py
Please enter correct password for flag: 691d
Welcome back... your flag, user:
picoCTF{545h_r1ng1ng_56891419}
```
 
 We got the flag :)

{{< flag "picoCTF{545h_r1ng1ng_56891419}" >}}