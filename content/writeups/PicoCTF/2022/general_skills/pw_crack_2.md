---
title: "PW Crack 2"
cat: "chal"
solved: true
points: 100
solves: 38685
date: 2024-05-12T00:00:00Z
draft: false
---

# PW Crack 2

{{< section type="info" title="Challenge Information" icon="info-circle" >}}
**Category:** General Skills  
**Points:** 100  
**Solves:** 38685

**Description:**   
Can you crack the password to get the flag? Download the password checker here and you'll need the encrypted flag in the same directory too.
{{< /section >}}

This is basically the same challenge as the last one, except that the password is not immediately evident as it is written in a hex format.

{{< section type="blue" title="Code Analysis" icon="code" >}}
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

Looking at this code, we need to figure out what `chr(0x33) + chr(0x39) + chr(0x63) + chr(0x65)` translates to in ASCII.
{{< /section >}}

{{< section type="requirements" title="Solution Approach" icon="lightbulb" >}}
The solution is straightforward:
1. Convert each hex value to its ASCII character using Python's `chr()` function
2. Concatenate them to get the password
3. Use this password to decrypt the flag
{{< /section >}}

Let's implement our solution:

{{< section type="document-green" title="Step 1: Convert Hex to ASCII" icon="terminal" >}}
First, let's determine what the password is by converting the hex values to ASCII:

```sh
>>> python3 -c "print(chr(0x33) + chr(0x39) + chr(0x63) + chr(0x65))"
39ce
```

The password is `39ce`.
{{< /section >}}

{{< section type="document-blue" title="Step 2: Use the Password" icon="key" >}}
Now we can use this password to get the flag:

```sh
>>> python3 level2.py
Please enter correct password for flag: 39ce
Welcome back... your flag, user:
picoCTF{tr45h_51ng1ng_502ec42e}
```

Alternatively, we could pipe the password directly to the script:

```sh
>>> python3 -c "print(chr(0x33) + chr(0x39) + chr(0x63) + chr(0x65))" | python3 level2.py
Please enter correct password for flag: Welcome back... your flag, user:
picoCTF{tr45h_51ng1ng_502ec42e}
```
{{< /section >}}

{{< section type="success" title="Flag" icon="flag" >}}
**picoCTF{tr45h_51ng1ng_502ec42e}**
{{< /section >}}