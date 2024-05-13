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
This is basically the same challenge as the last one, except that the password is not immediatly evident as it is written in an hex format:

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

Here the solution is trivial, we should simply print the password in ascii from hex and input it in the python script:

```sh
>>> python3 -c "print(chr(0x33) + chr(0x39) + chr(0x63) + chr(0x65))"
39ce

>>> python3 level2.py
Please enter correct password for flag: 39ce
Welcome back... your flag, user:
picoCTF{tr45h_51ng1ng_502ec42e}
```

Note that we could also simply pipe the print to the python script directly like that:

```sh
>>> python3 -c "print(chr(0x33) + chr(0x39) + chr(0x63) + chr(0x65))" | python3 level2.py
Please enter correct password for flag: Welcome back... your flag, user:
picoCTF{tr45h_51ng1ng_502ec42e}
```
   

<details><summary>🚩 FLAG</summary>  

```  
picoCTF{tr45h_51ng1ng_502ec42e}
```  
</details>