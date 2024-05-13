---
title: "PW Crack 2"
cat: "chal"
solved: true
points: 100
solves: 38685
date: 2024-05-12T00:00:00Z
draft: false
---

### PW Crack 2

**Category:** General Skills - **Points:** 100 - **Solves:** 38685

**Description:**   
Can you crack the password to get the flag? Download the password checker here and you'll need the encrypted flag in the same directory too.   

**Solution:**  
We are tasked to decrypt a file, when checking the code provided we see that its asking for a password to get the decrypted flag :

```python
def level_2_pw_check():
    user_pw = input("Please enter correct password for flag: ")
    if( user_pw == chr(0x33) + chr(0x39) + chr(0x63) + chr(0x65) ):
        print("Welcome back... your flag, user:")
        decryption = str_xor(flag_enc.decode(), user_pw)
        print(decryption)
        return
    print("That password is incorrect")
```

Here the solution is trivial, we should simply input the password and it will reveal the flag:

```sh
$ python3 -c "print(chr(0x33) + chr(0x39) + chr(0x63) + chr(0x65))" | python3 level2.py
```
   

<details><summary>🚩 FLAG</summary>  

```  
picoCTF{tr45h_51ng1ng_502ec42e}
```  
</details>